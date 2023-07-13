"use client";
import {useEffect, useState} from "react";
import {GET} from "@utils/request";


const Nav = () => {
    const [headerInfo, setHeaderInfo] = useState(undefined);


    useEffect(() => {
        GET(`${process.env.SERVER_HOST}/network/stats`).then((result) => {
            const data = Object.entries(result).map(([key, value]) => {
                const newKey = key.replaceAll("_", " ");
                return [`${newKey}`, value];
            });
            setHeaderInfo(data);
        });
    }, []);

    return (
        <div className="min-h-fit w-full flex gap-5 page_padding border-b border-gray-700 ">
            <div className="avatar">
                <div className="w-24 rounded-none">
                    <img src="/assets/images/avatar.jpg" alt='QR_code'/>
                </div>
            </div>
            <div className="avatar">
                <div className="w-24 rounded-none main_background">
                    <button>Free Money</button>
                </div>
            </div>
            <div className="avatar">
                <div className="w-24 rounded-none main_background">
                    <button>Update</button>
                </div>
            </div>
            <div className=" h-24 flex flex-col flex-wrap gap-x-5">
                {headerInfo &&
                    Array.from(headerInfo, ([key, value]) => (
                        <div className="flex flex-wrap gap-3" key={key}>
                            <span className="capitalize">{key}:</span>
                            <span>{value}</span>
                        </div>
                    ))}
            </div>
        </div>

    );
};
export default Nav;
