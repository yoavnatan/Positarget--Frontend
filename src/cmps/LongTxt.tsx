import { useState } from "react";

export function LongTxt({ txt, length = 90 }: { txt: string, length?: number }) {
    const [isShowLong, setIsShowLong] = useState(false)
    function onToggleIsShowLong() {
        setIsShowLong(isShowLong => !isShowLong)
    }

    const isLongText = txt.length > length
    const textToShow = isShowLong ? txt : (txt.substring(0, length))
    return (
        <section className="long-txt">
            <div className="bio">
                {isShowLong && textToShow}
                {!isShowLong && textToShow + '...'}
                {isLongText &&
                    <button onClick={onToggleIsShowLong}>
                        {isShowLong ? '' : ' Show More'}
                    </button>
                }
            </div>
        </section>
    );
}