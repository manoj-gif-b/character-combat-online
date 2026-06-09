const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET','POST'] } });

app.use(express.static(path.join(__dirname)));

const rooms = {};
const ODDS = [1,3,5,7,9];

function makeCode(){
  let code;
  do { code = Math.floor(1000+Math.random()*9000).toString(); } while(rooms[code]);
  return code;
}
function makeState(){
  return {
    turn:1,
    rolls:{1:{1:0,3:0,5:0,7:0,9:0},2:{1:0,3:0,5:0,7:0,9:0}},
    bullets:{1:0,2:0},
    gameOver:false, winner:null
  };
}
function finishTurn(st,player){ st.turn = player===1?2:1; }
function addBullet(st,player){
  st.bullets[player]++;
  if(st.bullets[player]>=3){ st.gameOver=true; st.winner=player; }
  else { finishTurn(st,player); }
}
function processRoll(room,player,n){
  const st=room.state;
  if(st.rolls[player][n]>=5) st.rolls[player][n]=0;
  st.rolls[player][n]++;
  if(st.rolls[player][n]===5){ addBullet(st,player); }
  else { finishTurn(st,player); }
}

io.on('connection',(socket)=>{
  console.log('+ connect',socket.id);

  socket.on('create_room',()=>{
    const code=makeCode();
    rooms[code]={p1:socket.id,p2:null,state:makeState(),code,rematch:new Set()};
    socket.join(code); socket.roomCode=code; socket.playerNum=1;
    socket.emit('room_created',{code,playerNum:1});
  });

  socket.on('join_room',({code})=>{
    const room=rooms[code];
    if(!room){socket.emit('join_error','Room not found. Check the code!');return;}
    if(room.p2){socket.emit('join_error','Room is full!');return;}
    room.p2=socket.id;
    socket.join(code); socket.roomCode=code; socket.playerNum=2;
    socket.emit('room_joined',{code,playerNum:2});
    io.to(room.p1).emit('opponent_joined',{name:'Player 2'});
    setTimeout(()=>io.to(code).emit('game_start',{state:room.state}),800);
  });

  socket.on('roll',({playerNum})=>{
    const code=socket.roomCode; const room=rooms[code];
    if(!room||room.state.gameOver) return;
    if(room.state.turn!==playerNum) return;
    const n=ODDS[Math.floor(Math.random()*5)];
    processRoll(room,playerNum,n);
    io.to(code).emit('roll_result',{playerNum,n,state:room.state});
  });

  socket.on('attack',({attackerNum,targetNum})=>{
    const code=socket.roomCode; const room=rooms[code];
    if(!room||room.state.gameOver) return;
    if(room.state.turn!==attackerNum) return;
    const victim=attackerNum===1?2:1;
    if(room.state.rolls[victim][targetNum]===0) return;
    if(room.state.bullets[attackerNum]<=0) return;
    room.state.bullets[attackerNum]--;
    room.state.rolls[victim][targetNum]=0;
    room.state.turn=attackerNum===1?2:1;
    io.to(code).emit('attack_result',{attackerNum,targetNum,state:room.state});
  });

  socket.on('rematch',()=>{
    const code=socket.roomCode; const room=rooms[code];
    if(!room) return;
    room.rematch.add(socket.id);
    if(room.rematch.size>=2){
      room.state=makeState(); room.rematch=new Set();
      io.to(code).emit('game_start',{state:room.state});
    } else {
      io.to(code).emit('rematch_vote',{votes:room.rematch.size});
    }
  });

  socket.on('disconnect',()=>{
    const code=socket.roomCode;
    if(code&&rooms[code]){
      io.to(code).emit('opponent_left');
      delete rooms[code];
    }
    console.log('- disconnect',socket.id);
  });
});

const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log(`✅ Server on port ${PORT}`));
