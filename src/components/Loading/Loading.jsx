import './Loading.css'

export default function Loading(){
    return(
        <>
        <div className='loading'>
            <span>Loading</span>
            <div className="jumping-dots">
                <div className="dot top"></div>
                <div className="dot middle"></div>
                <div className="dot"></div>
            </div>
        </div>
        </>
    )
}