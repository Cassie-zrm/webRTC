import { Card, Button } from "antd"
// import "./live.less"
import { useState, useRef } from "react"
import { io } from "socket.io-client"
const socket = io("http://localhost:3000")
const Live = () => {
  const video = useRef<HTMLVideoElement>(null)
  const [onOff, setOnOff] = useState(true)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [Record, setRecord] = useState<MediaRecorder | null>(null)
  const play = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    })
    const mediaRecord = new MediaRecorder(stream, {
      mimeType: "video/webm; codecs=vp9",
    })
    mediaRecord.addEventListener("dataavailable", (e) => {
      if (e.data.size > 0) {
        socket.emit("video-stream", e.data)
      }
    })
    mediaRecord.start(1000)
    setStream(stream)
    setRecord(mediaRecord)
    video!.current!.srcObject = stream
    video!.current!.play()
    setOnOff(false)
  }
  const close = () => {
    console.log("结束直播")
    video!.current!.srcObject = null
    video!.current!.pause()
    stream?.getTracks().forEach((track) => track.stop())
    Record?.stop()
    setOnOff(true)
    socket.emit("close")
  }
  return (
    <Card>
      <video ref={video} className="video" controls src=""></video>
      <div className="btn-group">
        {onOff ? (
          <Button onClick={() => play()} danger>
            开始直播
          </Button>
        ) : (
          <Button onClick={() => close()} type="primary">
            结束直播
          </Button>
        )}
      </div>
    </Card>
  )
}
export default Live
