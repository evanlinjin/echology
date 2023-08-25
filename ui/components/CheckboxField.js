import { useCallback } from "react";

const CheckboxField = ({
  label,
  unit,
  checked,
  disableCheckbox,
  disableInput,
  onChange,
  value,
  onToggleCheck,
}) => {
  const handleChange = useCallback((e) => {
    onChange(e);
  }, []);
  return (
    <div className="form-control gap-2 w-full">
      <label className="label cursor-pointer gap-2 items-center justify-start">
        <input
          type="checkbox"
          checked={checked}
          className="checkbox checkbox-sm rounded-none"
          disabled={disableCheckbox}
          onChange={() => onToggleCheck((prev) => !prev)}
        />
        <span className="label-text whitespace-nowrap">{label}</span>
      </label>
      <div className="flex gap-2 items-center flex-wrap">
        <input
          type="number"
          placeholder="Type here"
          min={0}
          className="input_field w-15"
          onChange={handleChange}
          pattern="[0-9]"
          value={value}
          disabled={disableInput}
        />
        <span className="whitespace-nowrap">{unit}</span>
      </div>
    </div>
  );
};
export default CheckboxField;
