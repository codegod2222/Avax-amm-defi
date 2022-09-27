import { ChangeEvent } from "react";
import styles from "./BoxTemplate.module.css";

const regValidNumber = /^[0-9]*[.]?[0-9]{0,6}$/; //TODO これをどこで使うのか検討

type Props = {
  leftHeader: string;
  right: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

export default function BoxTemplate({
  leftHeader,
  right,
  value,
  onChange,
}: Props) {
  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === "" || regValidNumber.test(e.target.value)) {
      onChange(e);
    }
  };
  return (
    <div className={styles.boxTemplate}>
      <div className={styles.boxBody}>
        <div>
          <p className={styles.leftHeader}> {leftHeader} </p>
          <input
            className={styles.textField}
            value={value}
            onChange={(e) => onInputChange(e)}
            placeholder={"Enter amount"}
          />
        </div>
        <div className={styles.rightContent}>{right}</div>
      </div>
    </div>
  );
}
