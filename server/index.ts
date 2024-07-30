import http from 'http'
import { Server } from 'socket.io'
import { spawn } from 'child_process'
const server = http.createServer()
const io = new Server(server, {
    cors: {
        origin: '*',
    }
})
// const 
let ffmpeg:any = null
io.on('connection', socket => {
    ffmpeg = spawn('ffmpeg', [
        '-i', 'pipe:0',
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-tune', 'zerolatency',
        '-c:a', 'aac',         // 使用 aac 音频编解码器
        '-b:a', '128k',        // 音频比特率为 128k
        '-f', 'flv',
        'rtmp://8.140.249.87:1935/live/stream'
    ])
    // ffmpeg = spawn('ffmpeg', [
    //     '-f', 'webm',
    //     '-i', 'pipe:0',
    //     '-c:v', 'libx264',
    //     '-preset', 'veryfast',
    //     '-tune', 'zerolatency',
    //     '-movflags', 'frag_keyframe+empty_moov',
    //     './output.mp4'
    // ])
    socket.on('video-stream', (data) => {
        if (ffmpeg) {
            ffmpeg.stdin.write(data)
        }
    })
    socket.on('disconnect', () => {
        if (ffmpeg) {
            ffmpeg.stdin.end()
            ffmpeg = null
        }
        console.log('断开连接')
    })
    socket.on('close', () => {
        if (ffmpeg) {
            ffmpeg.stdin.end()
            ffmpeg = null
        }
        console.log('直播结束')
    })
})

server.listen(3003, () => {
    console.log('server is running on port 3003')
})