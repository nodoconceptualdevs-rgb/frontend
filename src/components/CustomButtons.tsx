import { Button, ButtonProps } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import React from "react";
import styles from "./CustomButtons.module.css";

export function RedButtonWithIcon({ children, ...props }: ButtonProps) {
  return (
    <Button className={styles.redButton} {...props}>
      {children}
      <ArrowRightOutlined className={styles.arrowIcon} />
    </Button>
  );
}

export function RedButton({ children, ...props }: ButtonProps) {
  return (
    <Button className={styles.redButton} {...props}>
      {children}
    </Button>
  );
}
export function BlackButton({ children, ...props }: ButtonProps) {
  return (
    <Button className={styles.blackButton} {...props}>
      {children}
    </Button>
  );
}

export function RedOutlineBlackButton({ children, ...props }: ButtonProps) {
  return (
    <Button className={styles.redOutlineBlackButton} {...props}>
      {children}
      <ArrowRightOutlined className={styles.arrowIconBg} />
    </Button>
  );
}

export function RedButtonbgBlack({ children, ...props }: ButtonProps) {
  return (
    <Button className={styles.redButtonbgBlack} {...props}>
      {children}
      <ArrowRightOutlined className={styles.arrowIconBg} />
    </Button>
  );
}
