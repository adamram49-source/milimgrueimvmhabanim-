let words = [];
let selected = [];
let gameId = getGameIdFromUrl() || generateId();
let editIndex = null;

// ---------- utils ----------
function generateId(){ return Math.random().toString(36).substring(2,10); }
function getGameIdFromUrl(){ return new URLSearchParams(location.search).get("id"); }
function saveGameToStorage(id,data){ localStorage.setItem("game_"+id,JSON.stringify(data)); }
function loadGameFromStorage(id){ const d=localStorage.getItem("game_"+id); return d?JSON.parse(d):null; }

// ---------- words ----------
function addOrUpdateWord(){
  const he=hebrew.value.trim(), en=english.value.trim();
  if(!he||!en) return;

  if(editIndex!==null){ words[editIndex]={he,en,matched:false}; editIndex=null; }
  else words.push({he,en,matched:false});

  resetWordEdit(); renderWordList(); updatePlayButton(); autoSave();
}

function resetWordEdit(){ hebrew.value=""; english.value=""; editIndex=null; }

function renderWordList(){
  const game=document.getElementById("game"); game.innerHTML="";
  const heCol=document.createElement("div"), enCol=document.createElement("div");
  heCol.className=enCol.className="column";

  words.forEach((w,i)=>{
    if(!w.matched){
      const h=createWord(w.he,"he",i);
      const e=createWord(w.en,"en",i);
      heCol.appendChild(h); enCol.appendChild(e);
    }
  });

  game.appendChild(heCol); game.appendChild(enCol);
}

function createWord(text,lang,index){
  const div=document.createElement("div"); div.className="word";
  const span=document.createElement("span"); span.textContent=text;
  const editBtn=document.createElement("button"); editBtn.textContent="✏️"; editBtn.className="small secondary";
  editBtn.onclick=(e)=>{ e.stopPropagation(); editWord(index); };
  div.appendChild(span); div.appendChild(editBtn);
  div.onclick=()=>selectWord(index,lang,div);
  return div;
}

function editWord(index){
  hebrew.value=words[index].he; english.value=words[index].en; editIndex=index;
}

// ---------- match ----------
function selectWord(index,lang,el){
  if(selected.length===2) return;
  selected.push({index,lang,el});
  el.classList.add("selected");

  if(selected.length===2){
    const [a,b]=selected;
    if(a.index===b.index&&a.lang!==b.lang){
      words[a.index].matched=true; showMessage("🎉 צדקת!");
    }else{ showMessage("❌ טעית"); 
      setTimeout(()=>{ a.el.classList.remove("selected"); b.el.classList.remove("selected");},300); return;
    }
    setTimeout(()=>{ renderWordList(); selected=[]; autoSave(); },500);
  }
}

// ---------- message ----------
function showMessage(txt){ const m=document.getElementById("message"); m.textContent=txt; setTimeout(()=>m.textContent="",1000); }

// ---------- save / load ----------
function saveGame(){ saveGameToStorage(gameId,words); renderSavedGames(); alert("נשמר ✅"); }
function autoSave(){ saveGameToStorage(gameId,words); }

function renderSavedGames(){
  const ul=document.getElementById("savedGames"); ul.innerHTML="";
  Object.keys(localStorage).filter(k=>k.startsWith("game_")).forEach(k=>{
    const id=k.replace("game_","");
    const li=document.createElement("li");
    li.innerHTML=`<span>משחק ${id}</span>
      <div>
      <button class="small" onclick="openGame('${id}')">פתח</button>
      <button class="small secondary" onclick="deleteGame('${id}')">מחק</button>
      </div>`;
    ul.appendChild(li);
  });
}

function openGame(id){
  const data=loadGameFromStorage(id); if(!data) return;
  gameId=id; words=data; history.replaceState({}, "", "?id="+id);
  renderWordList(); updatePlayButton();
}

function deleteGame(id){ localStorage.removeItem("game_"+id); renderSavedGames(); }

// ---------- play ----------
function updatePlayButton(){
  const section=document.getElementById("playSection");
  if(words.length>0){ section.style.display="block"; } else { section.style.display="none"; }
}

function startGame(){
  document.getElementById("playBtn").style.display="none";
  document.getElementById("exitBtn").style.display="inline-block";
  renderWordList();
}

function exitGame(){
  document.getElementById("playBtn").style.display="inline-block";
  document.getElementById("exitBtn").style.display="none";
  selected=[]; words.forEach(w=>w.matched=false); renderWordList();
}

// ---------- share ----------
function shareGame(){
  saveGame();
  const data={name:"משחק",pairs:words};
  const encoded=btoa(JSON.stringify(data));
  const base=location.origin+location.pathname;
  const link=`${base}?shared=${encoded}`;
  navigator.clipboard.writeText(link).then(()=>{ alert("קישור הועתק 📋"); }).catch(()=>{ prompt("העתק את הקישור הזה:",link); });
}

// ---------- load shared ----------
(function(){
  const params=new URLSearchParams(location.search);
  if(params.get("shared")){
    const data=JSON.parse(atob(params.get("shared")));
    const newGame={id:Date.now(),words:data.pairs};
    words=newGame.words; gameId=newGame.id; autoSave();
    updatePlayButton(); renderWordList();
    history.replaceState({}, "", "?id="+gameId);
  }else if(getGameIdFromUrl()){
    const data=loadGameFromStorage(getGameIdFromUrl());
    if(data){ words=data; gameId=getGameIdFromUrl(); updatePlayButton(); renderWordList(); }
  }
  renderSavedGames();
})();
