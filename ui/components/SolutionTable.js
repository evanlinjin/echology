"use client";
import { memo, useCallback, useState } from "react";
import { RiBroadcastLine } from "react-icons/ri";
import { AiOutlineExclamationCircle } from "react-icons/ai";
import { GET, POST } from "@utils/request";
import Link from "next/link";
import { IoChevronBackOutline } from "react-icons/io5";
import TableHead from "@components/TableHead";
import { useCoinContext } from "@app/context/coins";
import { CopyToClipboard } from "@node_modules/react-copy-to-clipboard";

const SolutionTable = ({ solutions }) => {
  const { setErrorMessage } = useCoinContext();
  if (solutions.length === 0) {
    return null;
  }
  const titles = [
    "Txid",
    "Algorithm",
    "Change",
    "Waste",
    "Fee",
    "TX size",
    "Feerate",
  ];
  const [details, setDetails] = useState("");
  const [showCopied, setShowCopied] = useState(false);

  const handleBroadcast = useCallback((hex) => {
    POST(`http://localhost:8080/api/network/broadcast?tx=${hex}`).then(
      (result) => {
        if (result.error) {
          setErrorMessage(result.error);
        } else {
          window["broadcast_success_modal"].showModal();
        }
      },
    );
  }, []);

  const handleGetMoreDetails = useCallback((hex) => {
    GET(`http://localhost:8080/api/decode?tx=${hex}`)
      .then((result) => {
        if (result.error) {
          setErrorMessage(result.error);
        }
        setDetails(result);
      })
      .then(() => window["more_detail_modal"].showModal());
  }, []);
  return (
    <>
      <table className="main_table">
        <thead>
          <tr>
            <th></th>
            {titles.map((title, index) => (
              <TableHead key={index} label={title} />
            ))}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {solutions.length > 0 &&
            solutions.map((solution, index) => {
              const { txid, request, raw_tx } = solution;
              return (
                <tr className="hover" key={`solution${txid}:${index}`}>
                  <td>{index}</td>
                  <td
                    data-tip="Copied!"
                    className={`input_field break-words overflow-x-scroll max-w-[321px] h-[86px] ${
                      showCopied && "tooltip tooltip-left"
                    }`}
                  >
                    <CopyToClipboard
                      text={txid}
                      onCopy={() => {
                        setShowCopied(true);
                        setTimeout(() => setShowCopied(false), 1000);
                      }}
                      className="relative max-w-[550px] hover:cursor-pointer overflow-x-scroll"
                    >
                      <span>{txid}</span>
                    </CopyToClipboard>
                  </td>
                  {request?.algorithm ? (
                    <td className="input_field capitalize max-w-[150px]">
                      <span>{request.algorithm.split("_").join(" ")} </span>
                      <span className="lowercase">
                        (
                        {(solution?.request?.parameters?.metric &&
                          solution?.request?.parameters?.metric.replaceAll(
                            "_",
                            " ",
                          )) ||
                          (solution?.request?.parameters?.candidate_order &&
                            solution?.request?.parameters?.candidate_order.replaceAll(
                              "_",
                              " ",
                            ))}
                        )
                      </span>
                    </td>
                  ) : (
                    <td className="input_field">--</td>
                  )}
                  <td className="input_field capitalize">
                    {solution["metrics"] &&
                      solution["metrics"]["used_excess_strategy"]
                        .split("_")
                        .join(" ")}
                  </td>
                  <td className="input_field max-w-fit">
                    {solution["metrics"]
                      ? solution["metrics"]["waste"]
                      : undefined}
                  </td>
                  <td className="input_field">
                    {solution["metrics"] && solution["metrics"]["fee"]}
                  </td>
                  <td className="input_field">
                    {solution["metrics"] && solution["metrics"]["tx_size"]}
                  </td>
                  <td className="input_field">
                    {solution["metrics"] && solution["metrics"]["feerate"]}
                  </td>
                  <td>
                    <div className="flex gap-6">
                      <button
                        onClick={() => handleBroadcast(raw_tx)}
                        className="tooltip tooltip-bottom"
                        data-tip="Broadcast"
                      >
                        <RiBroadcastLine fontSize={24} />
                      </button>
                      <button
                        className="tooltip tooltip-bottom"
                        data-tip="More Detail"
                        onClick={() => handleGetMoreDetails(raw_tx)}
                      >
                        <AiOutlineExclamationCircle fontSize={24} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>

      <dialog id="broadcast_success_modal" className="modal">
        <form
          method="dialog"
          className="modal-box w-1/2 max-w-5xl rounded-none"
        >
          <h3 className="font-bold text-lg">Broadcast Success!</h3>
          <p className="py-4">Press ESC key or click outside to close</p>
          <div className="flex w-full">
            <Link
              href={"/coin-control"}
              className="main_button justify-self-end"
            >
              <IoChevronBackOutline />
              Back To Coin Control
            </Link>
          </div>
        </form>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      <dialog id="more_detail_modal" className="modal">
        <form
          method="dialog"
          className="modal-box w-11/12 max-w-5xl h-max rounded-none"
        >
          <h3 className="font-bold text-lg">More Details</h3>
          <p className="py-4">{JSON.stringify(details)}</p>
        </form>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
};
export default memo(SolutionTable);
