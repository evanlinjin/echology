import React, { useCallback } from "react";

const CheckboxField = ({ label, unit, checked, disabled, onChange, value }) => {
  const handleChange = useCallback((e) => {
    onChange(e);
  }, []);
  return (
    <div className="form-control gap-4 w-full">
      <label className="label cursor-pointer gap-4 items-center justify-start">
        <input
          type="checkbox"
          checked={checked}
          className="checkbox checkbox-sm border-none"
          disabled={disabled}
        />
        <span className="label-text whitespace-nowrap">{label}</span>
      </label>
      <div className="flex gap-4 items-center">
        <input
          type="number"
          placeholder="Type here"
          className="input_field w-15"
          onChange={handleChange}
          pattern="[0-9]"
          value={value}
        />
        <span className="whitespace-nowrap">{unit}</span>
      </div>
    </div>
  );
};
export default CheckboxField;
