import { ChangeEvent } from "react";
import styles from "./BoxTemplate.module.css";

type Props = {
  leftHeader: string;
  right: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
};
// TODO やっぱりここで変な数字ならセットしないってやった方がいいかも, 変な数字はそもそもセットして欲しくないから
export default function BoxTemplate({
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
