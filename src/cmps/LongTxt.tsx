import { useState } from "react";

export function LongTxt({ txt = '', length = 90 }: { txt?: string, length?: number }) {
    const [isShowLong, setIsShowLong] = useState(false)

    function onToggleIsShowLong() {
        setIsShowLong(prev => !prev)
    }

    if (!txt) return null

    const isLongText = txt.length > length

    // שימוש ב-substring בטוח כי וידאנו שיש txt
    const textToShow = isShowLong ? txt : txt.substring(0, length)

    return (
        <section className="long-txt">
            <div className="bio">
                {textToShow}
                {!isShowLong && isLongText && '...'}

                {isLongText && (
                    <button onClick={onToggleIsShowLong} className="toggle-btn">
                        {isShowLong ? ' Show Less' : ' Show More'}
                    </button>
                )}
            </div>
        </section>
    )
}