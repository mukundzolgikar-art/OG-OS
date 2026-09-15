/* =========================
   OG OS - FULL JAVASCRIPT
   ========================= */

document.addEventListener("DOMContentLoaded", () => {
    const $ = id => document.getElementById(id);
    let z = 50;

    /* ---------- Clock ---------- */
    function updateClock() {
        const now = new Date();
        const clock24 = $("clock24")?.checked;
        let h = now.getHours();
        const m = String(now.getMinutes()).padStart(2,"0");
        const s = String(now.getSeconds()).padStart(2,"0");
        let suffix = "";
        if (!clock24) {
            suffix = h >= 12 ? " PM" : " AM";
            h = h % 12 || 12;
        }
        $("clock").textContent = `${String(h).padStart(2,"0")}:${m}:${s}${suffix}`;
        $("date").textContent = now.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"});
    }
    updateClock();
    setInterval(updateClock,1000);

    /* ---------- Windows ---------- */
    function focusWindow(win) {
        if (!win) return;
        win.style.zIndex = ++z;
    }

    function openWindow(id) {
        const win = $(id);
        if (!win) return;
        win.style.display = "block";
        win.classList.remove("minimized");
        focusWindow(win);
        if (id === "filesWindow") renderFiles();
        if (id === "downloadsWindow") renderDownloads();
        if (id === "trashWindow") renderTrash();
        if (id === "notesWindow") renderNotesList();
    }

    document.querySelectorAll(".window").forEach(win => {
        const top = win.querySelector(".window-top");
        win.addEventListener("mousedown", () => focusWindow(win));
        win.querySelector(".closeBtn")?.addEventListener("click", e => {
            e.stopPropagation();
            win.style.display = "none";
        });
        win.querySelector(".minimizeBtn")?.addEventListener("click", e => {
            e.stopPropagation();
            win.classList.add("minimized");
        });
        win.querySelector(".maximizeBtn")?.addEventListener("click", e => {
            e.stopPropagation();
            win.classList.toggle("maximized");
            focusWindow(win);
        });

        let dragging=false, ox=0, oy=0;
        top?.addEventListener("mousedown", e => {
            if (e.target.closest(".window-buttons") || win.classList.contains("maximized")) return;
            dragging=true;
            const r=win.getBoundingClientRect();
            ox=e.clientX-r.left; oy=e.clientY-r.top;
            focusWindow(win);
            e.preventDefault();
        });
        document.addEventListener("mousemove", e => {
            if (!dragging) return;
            let x=e.clientX-ox, y=e.clientY-oy;
            x=Math.max(0,Math.min(x,window.innerWidth-win.offsetWidth));
            y=Math.max(55,Math.min(y,window.innerHeight-win.offsetHeight));
            win.style.left=x+"px"; win.style.top=y+"px";
        });
        document.addEventListener("mouseup",()=>dragging=false);
    });

    const desktopIcons = {
        filesIcon:"filesWindow", browserIcon:"browserWindow",
        appCenterIcon:"appCenterWindow", trashIcon:"trashWindow"
    };
    Object.entries(desktopIcons).forEach(([icon,id]) => $(icon)?.addEventListener("dblclick",()=>openWindow(id)));
    document.addEventListener("click", e => {
        const target=e.target.closest("[data-open]");
        if (!target || target.closest(".window-top")) return;
        if (target.classList.contains("app-card") || target.classList.contains("primary-btn")) {
            openWindow(target.dataset.open);
        }
    });

    /* ---------- File system in localStorage ---------- */
    const FS_KEY="ogFileSystemV2";
    const TRASH_KEY="ogTrashV2";
    const NOTE_KEY="ogNotesV2";

    function initialFS() {
        return {
            folders: {
                Documents:[], Pictures:[], Downloads:[], Projects:[], Notes:[]
            },
            root: [
                {id:crypto.randomUUID(),name:"README.txt",type:"text",folder:"root",content:"Welcome to THE OG OS!"},
                {id:crypto.randomUUID(),name:"OG_OS.txt",type:"text",folder:"root",content:"THE OG OS - Small steps. Big dreams."}
            ]
        };
    }
    function getFS(){ let x; try{x=JSON.parse(localStorage.getItem(FS_KEY))}catch{}; if(!x||!x.folders)return initialFS(); return x; }
    function saveFS(fs){localStorage.setItem(FS_KEY,JSON.stringify(fs))}
    function getTrash(){try{return JSON.parse(localStorage.getItem(TRASH_KEY))||[]}catch{return []}}
    function saveTrash(t){localStorage.setItem(TRASH_KEY,JSON.stringify(t))}
    let currentFolder="root";

    function iconFor(item){
        if(item.type==="folder") return item.name==="Downloads"?"📥":item.name==="Pictures"?"🖼️":item.name==="Notes"?"📝":"📁";
        if(item.type==="image") return "🖼️";
        if(item.type==="text") return "📄";
        if(item.type==="pdf") return "📕";
        return "📄";
    }
    function itemsInFolder(folder){
        const fs=getFS();
        if(folder==="root") return fs.root;
        return fs.folders[folder] || [];
    }
    function renderFiles(){
        const fs=getFS(), grid=$("fileGrid");
        $("fileBreadcrumb").textContent=currentFolder==="root"?"Home":`Home / ${currentFolder}`;
        grid.innerHTML="";
        if(currentFolder==="root"){
            Object.keys(fs.folders).forEach(name=>addFileCard(grid,{id:"folder-"+name,name,type:"folder",folder:name}));
        }
        itemsInFolder(currentFolder).forEach(item=>addFileCard(grid,item));
        if(!grid.children.length) grid.innerHTML='<div class="empty-state">This folder is empty.</div>';
    }
    function addFileCard(grid,item){
        const card=document.createElement("div");
        card.className="file-item";
        card.innerHTML=`<div class="file-icon">${iconFor(item)}</div><div class="file-name">${escapeHtml(item.name)}</div><div class="file-meta">${item.type==="folder"?"Folder":"File"}</div><button class="delete-mark" title="Move to Trash">🗑️</button>`;
        card.querySelector(".delete-mark").addEventListener("click",e=>{e.stopPropagation(); moveToTrash(item)});
        card.addEventListener("dblclick",()=>openFileItem(item));
        grid.appendChild(card);
    }
    function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
    function openFileItem(item){
        if(item.type==="folder"){
            if(item.name==="Downloads"){openWindow("downloadsWindow");return;}
            currentFolder=item.name; renderFiles(); return;
        }
        $("viewerTitle").textContent=iconFor(item)+" "+item.name;
        $("viewerText").style.display="none"; $("viewerImage").style.display="none"; $("viewerOther").style.display="none";
        if(item.type==="image" && item.data){
            $("viewerImage").src=item.data; $("viewerImage").style.display="block";
        }else if(item.content!==undefined){
            $("viewerText").textContent=item.content; $("viewerText").style.display="block";
        }else{
            $("viewerOther").textContent="This file can be stored in OG OS, but the browser cannot preview this format directly."; $("viewerOther").style.display="block";
        }
        openWindow("fileViewerWindow");
    }
    function moveToTrash(item){
        const fs=getFS();
        if(item.type==="folder"){alert("Delete the files inside the folder first.");return;}
        const folder=item.folder||currentFolder;
        if(folder==="root") fs.root=fs.root.filter(x=>x.id!==item.id);
        else fs.folders[folder]=(fs.folders[folder]||[]).filter(x=>x.id!==item.id);
        const trash=getTrash(); trash.push({...item,deletedFrom:folder,deletedAt:new Date().toISOString()});
        saveFS(fs);saveTrash(trash);renderFiles();renderTrash();
    }
    function renderDownloads(){
        const fs=getFS(), grid=$("downloadsGrid"); grid.innerHTML="";
        (fs.folders.Downloads||[]).forEach(item=>addFileCard(grid,item));
        if(!grid.children.length) grid.innerHTML='<div class="empty-state">No downloads yet.</div>';
    }
    function renderTrash(){
        const grid=$("trashGrid"), trash=getTrash(); grid.innerHTML="";
        trash.forEach(item=>{
            const card=document.createElement("div");card.className="file-item";
            card.innerHTML=`<div class="file-icon">${iconFor(item)}</div><div class="file-name">${escapeHtml(item.name)}</div><div class="file-meta">Deleted from ${escapeHtml(item.deletedFrom||"Home")}</div><button class="delete-mark" title="Restore">↩️</button>`;
            card.querySelector(".delete-mark").addEventListener("click",e=>{e.stopPropagation();restoreItem(item.id)});
            card.addEventListener("dblclick",()=>openFileItem(item));
            grid.appendChild(card);
        });
        if(!grid.children.length) grid.innerHTML='<div class="empty-state">🗑️ Trash is empty.</div>';
    }
    function restoreItem(id){
        const trash=getTrash(), item=trash.find(x=>x.id===id); if(!item)return;
        const fs=getFS(), folder=item.deletedFrom||"root"; delete item.deletedFrom; delete item.deletedAt;
        if(folder==="root") fs.root.push(item); else {fs.folders[folder]??=[];fs.folders[folder].push(item)}
        saveFS(fs);saveTrash(trash.filter(x=>x.id!==id));renderTrash();renderFiles();
    }
    $("emptyTrashBtn").addEventListener("click",()=>{if(confirm("Permanently delete everything in Trash?")){saveTrash([]);renderTrash()}});
    $("clearDownloadsBtn").addEventListener("click",()=>{if(confirm("Move all downloads to Trash?")){const fs=getFS();const trash=getTrash();trash.push(...(fs.folders.Downloads||[]).map(x=>({...x,deletedFrom:"Downloads",deletedAt:new Date().toISOString()})));fs.folders.Downloads=[];saveFS(fs);saveTrash(trash);renderDownloads();renderTrash()}});
    $("newFolderBtn").addEventListener("click",()=>{
        const name=prompt("Folder name:");
        if(!name)return;
        const fs=getFS();
        if(currentFolder!=="root"){alert("New folders can be added from Home.");return}
        if(fs.folders[name]||fs.root.some(x=>x.name===name)){alert("That folder already exists.");return}
        fs.folders[name]=[];saveFS(fs);renderFiles();
    });

    function addUploadedFile(file,folder,type){
        const reader=new FileReader();
        reader.onload=()=>{
            const fs=getFS();
            fs.folders[folder]??=[];
            fs.folders[folder].push({id:crypto.randomUUID(),name:file.name,type,folder,content:type==="text"?reader.result:undefined,data:type==="image"?reader.result:undefined});
            try{saveFS(fs);renderFiles();}catch{alert("This file is too large for browser localStorage. Try a smaller file.");}
        };
        reader.readAsDataURL(file);
    }
    $("documentPicker").addEventListener("change",e=>{const f=e.target.files[0];if(f)addUploadedFile(f,"Documents",f.type==="application/pdf"?"pdf":"document");e.target.value=""});
    $("picturePicker").addEventListener("change",e=>{const f=e.target.files[0];if(f)addUploadedFile(f,"Pictures","image");e.target.value=""});

    /* ---------- Notes: each saved note is a real file in Files -> Notes ---------- */
    let activeNoteId=null;
    function getNotes(){try{return JSON.parse(localStorage.getItem(NOTE_KEY))||[]}catch{return []}}
    function saveNotesData(x){localStorage.setItem(NOTE_KEY,JSON.stringify(x))}
    function renderNotesList(){
        const list=$("noteList"),notes=getNotes();list.innerHTML="";
        notes.forEach(n=>{const d=document.createElement("div");d.className="note-entry"+(n.id===activeNoteId?" active":"");d.textContent=n.name;d.addEventListener("click",()=>loadNote(n.id));list.appendChild(d)});
        if(activeNoteId===null && notes.length) loadNote(notes[0].id);
    }
    function loadNote(id){
        const n=getNotes().find(x=>x.id===id);if(!n)return;
        activeNoteId=id;$("noteName").value=n.name;$("notesText").value=n.content;renderNotesList();
    }
    $("newNoteBtn").addEventListener("click",()=>{activeNoteId=null;$("noteName").value="";$("notesText").value="";$("noteName").focus()});
    $("saveNotes").addEventListener("click",()=>{
        let name=$("noteName").value.trim()||"Untitled Note";
        if(!name.toLowerCase().endsWith(".txt"))name+=".txt";
        const content=$("notesText").value;
        const notes=getNotes();
        if(activeNoteId){const n=notes.find(x=>x.id===activeNoteId);if(n){n.name=name;n.content=content}}
        else{activeNoteId=crypto.randomUUID();notes.push({id:activeNoteId,name,content})}
        saveNotesData(notes);
        const fs=getFS();fs.folders.Notes=notes.map(n=>({id:n.id,name:n.name,type:"text",folder:"Notes",content:n.content}));saveFS(fs);
        renderNotesList();
        const btn=$("saveNotes");btn.textContent="✅ Saved to Notes";setTimeout(()=>btn.textContent="💾 Save to Notes",1200);
    });
    $("deleteNoteBtn").addEventListener("click",()=>{
        if(!activeNoteId)return;
        const notes=getNotes(),n=notes.find(x=>x.id===activeNoteId);if(!n)return;
        const fs=getFS();fs.folders.Notes=(fs.folders.Notes||[]).filter(x=>x.id!==n.id);
        const trash=getTrash();trash.push({...n,type:"text",folder:"Notes",deletedFrom:"Notes",deletedAt:new Date().toISOString()});
        saveFS(fs);saveTrash(trash);saveNotesData(notes.filter(x=>x.id!==activeNoteId));activeNoteId=null;$("noteName").value="";$("notesText").value="";renderNotesList();renderTrash();
    });

    /* ---------- Calculator ---------- */
    let calc="";
    const calcDisplay=$("calcDisplay");
    document.querySelectorAll("[data-calc]").forEach(btn=>btn.addEventListener("click",()=>{
        const v=btn.dataset.calc;
        if(v==="clear"){calc="";calcDisplay.value="0";return}
        if(v==="back"){calc=calc.slice(0,-1);calcDisplay.value=calc||"0";return}
        if(v==="="){
            if(!calc)return;
            try{
                const safe=calc.replace(/%/g,"/100");
                if(!/^[0-9+\-*/().\s]+$/.test(safe))throw Error();
                const result=Function('"use strict";return ('+safe+')')();
                if(!Number.isFinite(result))throw Error();
                calc=String(result);calcDisplay.value=calc;
            }catch{calc="";calcDisplay.value="Error"}
            return;
        }
        calc+=v;calcDisplay.value=calc;
    }));

    /* ---------- Settings ---------- */
    $("windowGlow").addEventListener("change",e=>document.body.classList.toggle("no-glow",!e.target.checked));
    $("glassMode").addEventListener("change",e=>document.body.classList.toggle("no-glass",!e.target.checked));
    $("clock24").addEventListener("change",updateClock);

    /* ---------- Browser ---------- */
    const address=$("browserAddress"), input=$("browserInput"), page=$("browserPage");
    function searchBrowser(q){
        q=q.trim();if(!q)return;
        const owner=/who\s+(is|owns)|owner\s+of\s+og\s+os|who created og os/i.test(q);
        if(owner){
            page.innerHTML='<div class="browser-result"><h2>🔎 OG Browser Search</h2><p>Your search:</p><div class="owner">The Great Mukund Zolgikar</div><p>According to OG OS, the owner is <strong>The Great Mukund Zolgikar</strong>.</p><p>For normal web searches, OG Browser can open real search results in a new browser tab.</p></div>';
            return;
        }
        const url="https://www.google.com/search?q="+encodeURIComponent(q);
        address.value=q;
        page.innerHTML=`<div class="browser-result"><h2>🔎 Searching the web...</h2><p>OG Browser is opening real Google results for <strong>${escapeHtml(q)}</strong>.</p><a href="${url}" target="_blank" rel="noopener">Open search results ↗</a><p class="hint">A local HTML app cannot reproduce the full Chrome engine or embed every website because many sites block embedding.</p></div>`;
        window.open(url,"_blank","noopener");
    }
    $("browserSearchBtn").addEventListener("click",()=>searchBrowser(input.value));
    input.addEventListener("keydown",e=>{if(e.key==="Enter")searchBrowser(input.value)});
    $("browserGo").addEventListener("click",()=>navigateAddress(address.value));
    address.addEventListener("keydown",e=>{if(e.key==="Enter")navigateAddress(address.value)});
    function navigateAddress(v){
        v=v.trim();if(!v)return;
        if(/^https?:\/\//i.test(v)){window.open(v,"_blank","noopener");return}
        searchBrowser(v);
    }
    $("browserHome").addEventListener("click",()=>location.reload());
    document.querySelectorAll(".browser-shortcuts button").forEach(b=>b.addEventListener("click",()=>window.open(b.dataset.url,"_blank","noopener")));

    /* ---------- Games ---------- */
    const snakeCanvas=$("snakeCanvas"), sctx=snakeCanvas.getContext("2d");
    let snake=[],food={x:10,y:10},dir={x:1,y:0},nextDir={x:1,y:0},snakeScore=0,snakeTimer=null;
    function startSnake(){
        $("gamesMenu").hidden=true;$("platformGamePanel").hidden=true;$("snakeGamePanel").hidden=false;
        snake=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];dir={x:1,y:0};nextDir={x:1,y:0};snakeScore=0;placeFood();$("snakeScore").textContent=0;
        clearInterval(snakeTimer);snakeTimer=setInterval(stepSnake,110);drawSnake();
    }
    function placeFood(){food={x:Math.floor(Math.random()*21),y:Math.floor(Math.random()*21)};if(snake.some(p=>p.x===food.x&&p.y===food.y))placeFood()}
    function stepSnake(){
        dir=nextDir;const head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
        if(head.x<0||head.y<0||head.x>=21||head.y>=21||snake.some(p=>p.x===head.x&&p.y===head.y)){clearInterval(snakeTimer);saveHighScore(OG_SNAKE_HS,snakeScore);alert("Snake game over! Score: "+snakeScore+"\\nBest: "+getHighScore(OG_SNAKE_HS));return}
        snake.unshift(head);
        if(head.x===food.x&&head.y===food.y){snakeScore++;$("snakeScore").textContent=snakeScore;placeFood()}else snake.pop();
        drawSnake();
    }
    function drawSnake(){
        sctx.clearRect(0,0,420,420);sctx.fillStyle="#0a1d3d";sctx.fillRect(0,0,420,420);
        const cell=20;sctx.fillStyle="#ffcf33";sctx.fillRect(food.x*cell+2,food.y*cell+2,16,16);
        snake.forEach((p,i)=>{sctx.fillStyle=i===0?"#72f1ff":"#3ac9d9";sctx.fillRect(p.x*cell+2,p.y*cell+2,16,16)});
    }
    document.addEventListener("keydown",e=>{
        // IMPORTANT: Only capture game keys while a game is actually open.
        // This prevents W/A/S/D from being blocked while typing in Notes,
        // the browser search box, filenames, etc.
        const active = document.activeElement;
        const typing = active && (
            active.tagName === "INPUT" ||
            active.tagName === "TEXTAREA" ||
            active.tagName === "SELECT" ||
            active.isContentEditable
        );

        const snakeIsOpen = $("snakeGamePanel").hidden === false;
        if (!snakeIsOpen || typing) return;

        const k=e.key.toLowerCase();
        const map={
            arrowup:[0,-1], w:[0,-1],
            arrowdown:[0,1], s:[0,1],
            arrowleft:[-1,0], a:[-1,0],
            arrowright:[1,0], d:[1,0]
        };

        if(map[k]){
            const [x,y]=map[k];
            if(x!==-dir.x || y!==-dir.y) nextDir={x,y};
            e.preventDefault();
        }

        if(e.code==="Space" && snakeTimer===null){
            e.preventDefault();
            startSnake();
        }
    });
    $("snakeSelect").addEventListener("click",startSnake);

    const pc=$("platformCanvas"),pctx=pc.getContext("2d");
    let keys={},player,coins,platforms=[],platformScore=0,pTimer,cameraX=0,nextPlatformX=0;

    function startPlatformer(){
        $("gamesMenu").hidden=true;
        $("snakeGamePanel").hidden=true;
        $("platformGamePanel").hidden=false;

        player={x:40,y:280,w:28,h:38,vx:0,vy:0,onGround:false};
        platformScore=0;
        cameraX=0;
        $("platformScore").textContent=0;

        // Starting area.
        platforms=[
            {x:0,y:330,w:700,h:30},
            {x:140,y:275,w:110,h:18},
            {x:300,y:225,w:120,h:18},
            {x:470,y:175,w:120,h:18},
            {x:610,y:315,w:70,h:15}
        ];
        coins=[
            {x:210,y:265},
            {x:360,y:195},
            {x:540,y:145},
            {x:650,y:285}
        ];

        nextPlatformX=700;
        generateWorld(3600);

        clearInterval(pTimer);
        pTimer=setInterval(platformLoop,30);
        drawPlatformer();
    }

    // Keep creating platforms and coins forever as the player moves right.
    function generateWorld(untilX){
        while(nextPlatformX<untilX){
            const gap=70+Math.random()*90;
            const width=90+Math.random()*150;
            const y=175+Math.random()*125;

            nextPlatformX+=gap;

            const pl={x:nextPlatformX,y:Math.round(y),w:Math.round(width),h:18};
            platforms.push(pl);

            // Most platforms get a coin.
            if(Math.random()<0.82){
                coins.push({
                    x:Math.round(pl.x+pl.w/2),
                    y:Math.round(pl.y-22)
                });
            }

            nextPlatformX+=width;
        }
    }

    function platformLoop(){
        // Generate more world ahead of the player.
        generateWorld(player.x+1800);

        // Movement.
        player.vx=(keys.ArrowRight||keys.d?3.2:0)-(keys.ArrowLeft||keys.a?3.2:0);

        // Small automatic forward movement keeps the game feeling infinite.
        if(!keys.ArrowLeft && !keys.a && !keys.ArrowRight && !keys.d){
            player.vx=2.2;
        }

        player.vy+=.55;

        if((keys.ArrowUp||keys.w||keys[" "])&&player.onGround){
            player.vy=-10;
            player.onGround=false;
        }

        const oldY=player.y;
        player.x+=player.vx;
        player.y+=player.vy;
        player.onGround=false;

        // Collision with every platform near the player.
        for(const pl of platforms){
            if(
                player.x+player.w>pl.x &&
                player.x<pl.x+pl.w &&
                oldY+player.h<=pl.y &&
                player.y+player.h>=pl.y &&
                player.vy>=0
            ){
                player.y=pl.y-player.h;
                player.vy=0;
                player.onGround=true;
            }
        }

        // Collect coins.
        coins=coins.filter(c=>{
            if(Math.hypot((player.x+14)-c.x,(player.y+19)-c.y)<25){
                platformScore++;
                $("platformScore").textContent=platformScore;
                if(typeof saveHighScore==="function"){
                    saveHighScore(OG_PLATFORM_HS,platformScore);
                }
                return false;
            }
            return true;
        });

        // Infinite-game rule:
        // falling off the current platform does NOT restart the whole game.
        // The player is returned to the latest safe area with the score intact.
        if(player.y>500){
            player.y=180;
            player.vy=0;

            // Put the player on a nearby generated platform.
            const safe=platforms.find(pl =>
                pl.x>player.x-40 &&
                pl.x<player.x+260
            );

            if(safe){
                player.x=Math.max(safe.x+5,Math.min(player.x,safe.x+safe.w-player.w-5));
                player.y=safe.y-player.h;
            }else{
                player.x=Math.max(40,player.x-120);
            }
        }

        // Camera follows the player.
        cameraX=Math.max(0,player.x-170);

        // Remove very old objects to keep the game fast forever.
        const keepFrom=cameraX-500;
        platforms=platforms.filter(pl=>pl.x+pl.w>keepFrom);
        coins=coins.filter(c=>c.x>keepFrom);

        drawPlatformer();
    }

    function drawPlatformer(){
        pctx.clearRect(0,0,700,360);

        // Night-sky background.
        pctx.fillStyle="#07152f";
        pctx.fillRect(0,0,700,360);

        // Distant stars.
        pctx.fillStyle="rgba(255,255,255,.8)";
        for(let i=0;i<45;i++){
            const sx=((i*137)%1200)-((cameraX*.15)%1200);
            const sy=(i*67)%190;
            if(sx>=0&&sx<=700)pctx.fillRect(sx,sy,2,2);
        }

        // Moon.
        pctx.fillStyle="#dcecff";
        pctx.beginPath();
        pctx.arc(590,65,25,0,Math.PI*2);
        pctx.fill();

        // Distant hills.
        pctx.fillStyle="#102d5b";
        pctx.beginPath();
        pctx.moveTo(0,280);
        for(let x=0;x<=700;x+=70){
            pctx.lineTo(x,220+Math.sin((x+cameraX*.08)*.02)*35);
        }
        pctx.lineTo(700,360);
        pctx.lineTo(0,360);
        pctx.fill();

        // Platforms in screen coordinates.
        platforms.forEach(pl=>{
            const sx=pl.x-cameraX;
            if(sx+pl.w<0||sx>700)return;

            pctx.fillStyle="#59b8ff";
            pctx.fillRect(sx,pl.y,pl.w,pl.h);

            pctx.fillStyle="#a9e3ff";
            pctx.fillRect(sx,pl.y,pl.w,4);
        });

        // Coins.
        coins.forEach(c=>{
            const sx=c.x-cameraX;
            if(sx<-20||sx>720)return;

            pctx.fillStyle="#ffd447";
            pctx.beginPath();
            pctx.arc(sx,c.y,9,0,Math.PI*2);
            pctx.fill();

            pctx.fillStyle="#fff3a3";
            pctx.fillRect(sx-2,c.y-6,3,12);
        });

        // Player.
        const px=player.x-cameraX;
        pctx.fillStyle="#ff6b8a";
        pctx.fillRect(px,player.y,player.w,player.h);

        pctx.fillStyle="white";
        pctx.fillRect(px+6,player.y+8,5,5);
        pctx.fillRect(px+18,player.y+8,5,5);

        // Distance indicator.
        pctx.fillStyle="rgba(255,255,255,.8)";
        pctx.font="14px Arial";
        pctx.fillText("Distance: "+Math.floor(player.x/10)+" m",18,25);
    }

    window.addEventListener("keydown",e=>{
        const active=document.activeElement;
        const typing=active && (active.tagName==="INPUT" || active.tagName==="TEXTAREA" || active.isContentEditable);
        if(!$("platformGamePanel").hidden && !typing) keys[e.key]=true;
    });
    window.addEventListener("keyup",e=>{delete keys[e.key]});
    $("platformSelect").addEventListener("click",startPlatformer);
    document.querySelectorAll(".backGameBtn").forEach(b=>b.addEventListener("click",()=>{clearInterval(snakeTimer);clearInterval(pTimer);$("snakeGamePanel").hidden=true;$("platformGamePanel").hidden=true;$("gamesMenu").hidden=false}));

    /* ---------- Start ---------- */
    renderFiles();renderDownloads();renderTrash();renderNotesList();
});


/* ---------- Persistent Game High Scores ---------- */
const OG_SNAKE_HS="ogosSnakeHighScore";
const OG_PLATFORM_HS="ogosPlatformHighScore";

function getHighScore(key){ return Number(localStorage.getItem(key)||0); }

function saveHighScore(key, score){
    score=Number(score)||0;
    if(score>getHighScore(key)) localStorage.setItem(key,String(score));
    updateHighScores();
}

function updateHighScores(){
    const s=document.getElementById("snakeHighScore");
    const p=document.getElementById("platformHighScore");
    if(s) s.textContent=getHighScore(OG_SNAKE_HS);
    if(p) p.textContent=getHighScore(OG_PLATFORM_HS);
}

document.addEventListener("DOMContentLoaded",()=>{
    updateHighScores();
    document.getElementById("resetHighScores")?.addEventListener("click",()=>{
        if(confirm("Reset both OG OS game high scores?")){
            localStorage.removeItem(OG_SNAKE_HS);
            localStorage.removeItem(OG_PLATFORM_HS);
            updateHighScores();
        }
    });
});
