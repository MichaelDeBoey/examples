import cx from "clsx";
import type {
  ComponentPropsWithRef,
  PropsWithChildren,
  ReactNode,
} from "react";
import { createContext, forwardRef, useContext } from "react";

import type { Spread } from "~/utils/types";

const FieldContext = createContext<FieldContextValue | null>(null);

export function useFieldContext() {
  return useContext(FieldContext);
}

const FieldProvider = forwardRef<
  HTMLDivElement,
  PropsWithChildren<FieldContextValue & { className?: string }>
>(({ children, className, ...ctx }, ref) => {
  return (
    <div ref={ref} className={cx(className, "ui--form-field-wrapper")}>
      <FieldContext.Provider value={ctx}>{children}</FieldContext.Provider>
    </div>
  );
});
FieldProvider.displayName = "FieldProvider";

type ResolvedFieldProps = FieldProps | SelectProps | TextareaProps;

export function getResolvedFieldProps<T extends ResolvedFieldProps>(
  context: FieldContextValue | null,
  props: T,
): T | Spread<[Omit<FieldContextValue, "error" | "invalid">, T]> {
  if (!context) {
    return props;
  }

  const { error, ...rest } = context;

  const ariaProps: Record<`aria-${string}`, any> = {};
  if (context && context.error && context.id) {
    const invalid = props["aria-invalid"] ?? context.invalid;
    ariaProps["aria-describedby"] =
      props["aria-describedby"] != null
        ? `${props["aria-describedby"]} ${context.id}-error`
        : `${context.id}-error`;
    ariaProps["aria-invalid"] = invalid === "false" ? false : (invalid ?? true);
  }

  return {
    ...rest,
    ...props,
    ...ariaProps,
  };
}

export const Field = forwardRef<HTMLInputElement, FieldProps>((props, ref) => {
  const context = useFieldContext();
  const resolvedProps = getResolvedFieldProps(context, props);

  return (
    <input
      type="text"
      ref={ref}
      {...resolvedProps}
      className={cx(props.className, "ui--form-field")}
    />
  );
},
);
Field.displayName = "Field";

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (props, ref) => {
    const context = useFieldContext();
    const resolvedProps = getResolvedFieldProps(context, props);
    return (
      <select
        ref={ref}
        {...resolvedProps}
        className={cx(
          props.className,
          "ui--form-field",
          "ui--form-field--select",
        )}
      />
    );
  },
);
Select.displayName = "Select";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (props, ref) => {
    const context = useFieldContext();
    const { resize = "y", ...resolvedProps } = getResolvedFieldProps(
      context,
      props,
    );

    return (
      <textarea
        ref={ref}
        {...resolvedProps}
        className={cx(
          props.className,
          "ui--form-field",
          "ui--form-field--textarea",
          {
            "resize-xy": resize === true,
            "resize-x": resize === "x",
            "resize-y": resize === "y",
          },
        )}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export const Label = forwardRef<HTMLLabelElement, LabelProps>((props, ref) => {
  const ctx = useFieldContext();
  const { className, children, ...domProps } = props;

  return (
    <label
      htmlFor={ctx?.id || props.htmlFor}
      ref={ref}
      {...domProps}
      className={cx(className, "ui--form-label")}
    >
      {children}
      {ctx?.required ? <span className="sr-only"> (Required)</span> : null}
    </label>
  );
},
);
Label.displayName = "Label";

export const FieldError = forwardRef<HTMLDivElement, FieldErrorProps>(
  (props, ref) => {
    const context = useFieldContext();
    const { className, id, children, ...domProps } = props;
    const error: ReactNode = children || context?.error;
    const idToUse = context && context.id ? `${context.id}-error` : id;

    if (!error) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cx(className, "ui--form-field-error")}
        role="alert"
        id={idToUse}
        {...domProps}
      >
        {error}
      </div>
    );
  },
);
FieldError.displayName = "FieldError";

// Not intended to be exhaustive!
type InputType =
  | "email"
  | "text"
  | "hidden"
  | "password"
  | "search"
  | "tel"
  | "url";

export interface FieldProps
  extends Omit<ComponentPropsWithRef<"input">, "type"> {
  type?: InputType;
}

export interface FieldErrorProps extends ComponentPropsWithRef<"div"> {
  alert?: boolean;
}

export interface SelectProps extends ComponentPropsWithRef<"select"> {}

export interface TextareaProps extends ComponentPropsWithRef<"textarea"> {
  resize?: "x" | "y" | boolean;
}

export interface LabelProps extends ComponentPropsWithRef<"label"> {}

interface FieldContextValue {
  name?: string;
  id?: string;
  invalid?: ComponentPropsWithoutRef<"input">["aria-invalid"];
  disabled?: boolean;
  required?: boolean;
  error?: string | null;
}
