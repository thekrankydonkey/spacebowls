import { draw_all, draw_line, clear_board, create_players, move, bowls, radius } from './gravity';
import { delay } from "./util";

const button = document.getElementById("login");
const input = document.getElementById("username");
const canvas = document.getElementById("game");
export let id;
let alt_id;
let max_vec = 25;

button.disabled = input.value ? false : true;

input.addEventListener("input", function(event) {
  button.disabled = input.value ? false : true;
});

button.addEventListener("click", async function(event) {
    // put code here
    let response = await fetch("/name", { method: "POST", body: JSON.stringify({ name: input.value }) });
    const data = await response.json();
    console.log(input.value);
    console.log(data.players);
    id = data.players[input.value];
    alt_id = input.value;
    if (data == -1) {
        document.getElementById("status").innerText = "Name taken. Enter a different name."
    } else if (data == 0) {
        document.getElementById("status").innerText = "Player limit reached, try again later."
    } else {
        await goToMain();
    }
  
});

function goToLogin() {
    document.getElementById("main-page").style.display = "none";
    document.getElementById("login-page").style.display = "flex";
}

async function goToMain() {
    document.getElementById("login-page").style.display = "none";
    document.getElementById("main-page").style.display = "grid";
    while(1){
        await delay(500);
        let response = await fetch("/get_players");
        const list = await response.json();
        create_players(list.players);
        console.log("X: " + bowls[id].vx + " Y: " + bowls[id].vy);
        if (list.players.length == 8){
            for (let i = 0; i < 3; ++i) {
              console.log("???");
              await goToRoundMove(list.players);
            }
            break;
        }
    }
}

function getCoordsInCanvas(x, y) {
  const { top, left, height, width } = canvas.getBoundingClientRect();
  const relative_x = canvas.width * (x - left) / width;
  const relative_y = canvas.height * (y - top) / height;

  return { x: relative_x, y: relative_y };
}

async function goToRoundMove(players){
    let vx, vy;

    if (bowls[id].in) {
      // this function draws an arrow from a player's bowl/planet and 
      //the length that they stretch it out to is the speed they're choosing
      let og_x = bowls[id].x
      let og_y = bowls[id].y;
      let new_x;
      let new_y;

      let resolve;
      const haveData = new Promise(res => {
        resolve = res;
      });

      function mouseDown(event) {
        const { x, y } = getCoordsInCanvas(event.clientX, event.clientY);
        console.log({ x, y });
        if ((x - og_x) * (x - og_x) + (y - og_y) * (y - og_y) < radius * radius) {
          document.removeEventListener("mousedown", mouseDown);

          function mouseMove(event) {
            const { x: move_x, y: move_y } = getCoordsInCanvas(event.clientX, event.clientY);
            clear_board();
            draw_all();
            let r = Math.sqrt(move_x*move_x + move_y*move_y);
            draw_line(og_x, og_y, move_x, move_y);
          }

          function mouseUp(event) {
            new_x = getCoordsInCanvas(event.clientX, event.clientY).x;
            new_y = getCoordsInCanvas(event.clientX, event.clientY).y;

            console.log({ new_x, new_y });

            document.removeEventListener("mouseup", mouseUp);
            document.removeEventListener("mousemove", mouseMove);
            resolve();
          }

          document.addEventListener("mouseup", mouseUp);
          document.addEventListener("mousemove", mouseMove);
        }
      }

      document.addEventListener("mousedown", mouseDown);

      await haveData;

      let vx_unscaled = new_x - og_x;
      let vy_unscaled = new_y - og_y;

      const { height, width } = canvas.getBoundingClientRect();
      const maxDraw = Math.sqrt(height * height + width * width);

      vx = 50 / maxDraw * vx_unscaled;
      vy = 50 / maxDraw * vy_unscaled;
    } else {
      vx = 0;
      vy = 0;
    }

    let response = await fetch("/vector", { method: "POST", body: JSON.stringify({ name: { id, vx, vy } }) });
    let data = await response.json();
  
    while (data.vectors.some(x => x === null)) {
      response = await fetch("/get_vectors");
      data = await response.json();
      await delay(200);
    }

    await move(data.vectors);
}
