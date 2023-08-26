"use client";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { memo, useState } from "react";

const Copy = ({ content }) => {
  const [showCopied, setShowCopied] = useState(false);
  if (!content) {
    return null;
  }
  return (
    <CopyToClipboard text={content} onCopy={() => setShowCopied(true)}>
      <span
        className={`hover:cursor-pointer ${
          showCopied && "hover:tooltip hover:tooltip-open"
        } hover:bg-gray-200 item_padding`}
        data-tip="Copied!"
      >
        {content}
      </span>
    </CopyToClipboard>
  );
};

export default memo(Copy);
