function updateClock() {
    let now = new Date();

    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();

    let ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12;

    hours = String(hours).padStart(2, "0");
    minutes = String(minutes).padStart(2, "0");
    seconds = String(seconds).padStart(2, "0");

    document.getElementById("clock").innerText =
        hours + ":" + minutes + ":" + seconds + " " + ampm;
}

updateClock();

setInterval(updateClock, 1000);


document.addEventListener("DOMContentLoaded", function() {

    const closeBtn = document.getElementById("closeBtn");
    const myWindow = document.getElementById("myWindow");

    closeBtn.addEventListener("click", function() {
        myWindow.style.display = "none";
    });

});