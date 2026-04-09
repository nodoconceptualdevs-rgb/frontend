import React from "react";
import { Input, InputProps, InputRef } from "antd";
import styles from "./CustomInput.module.css";

interface CustomInputProps extends InputProps {
  label: string;
  error?: string;
}

const CustomInput = React.forwardRef<InputRef, CustomInputProps>(
  ({ label, error, type, ...props }, ref) => {
    const InputComponent = type === "password" ? Input.Password : Input;
    
    // No pasar el prop 'type' a Input.Password ya que no lo necesita
    const inputProps = type === "password" 
      ? { ...props } 
      : { type, ...props };
    
    return (
      <div className={styles.inputWrapper}>
        <label className={styles.label}>{label}</label>
        <InputComponent
          ref={ref}
          {...inputProps}
          className={styles.input + (error ? " " + styles.error : "")}
        />
        {error && <span className={styles.errorMsg}>{error}</span>}
      </div>
    );
  }
);

CustomInput.displayName = "CustomInput";

export default CustomInput;
