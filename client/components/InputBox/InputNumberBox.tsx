import { ChangeEvent } from "react";
import styles from "./InputNumberBox.module.css";

type Props = {
  leftHeader: string;
  right: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

export default function InputNumberBox({
  leftHeader,
  right,
  value,
  onChange,
}: Props) {
  return (
    <div className={styles.boxTemplate}>
      <div className={styles.boxBody}>
        <div>
          <p className={styles.leftHeader}> {leftHeader} </p>
          <input
            className={styles.textField}
            type="number"
            value={value}
            onChange={(e) => onChange(e)}
            placeholder={"Enter amount"}
          />
        </div>
        <div className={styles.rightContent}>{right}</div>
      </div>
    </div>
  );
}
