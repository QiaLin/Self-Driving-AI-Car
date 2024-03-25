function detectOrientation() {
    // if (isMobileDevice() && window.innerWidth > window.innerHeight) {
        if ( window.innerWidth > window.innerHeight) {
        // Landscape orientation on mobile
        document.getElementById('orientationNotice').style.display = 'none';
        // Proceed with your code here
        console.log('Horizontal orientation detected on mobile. Proceeding...');
    } else {
        // Portrait orientation on mobile

        // Detect browser language
        var userLang = navigator.language || navigator.userLanguage;

        // Update content based on language
        if (userLang.startsWith("en")) {
            orientationNotice.textContent = "Please rotate your device horizontally";
        } else if (userLang.startsWith("zh")) {
            orientationNotice.textContent = "请将您的设备水平旋转以进行AI可视化游戏";
        } else {
            // Default to English if language not supported
            orientationNotice.textContent = "Please rotate your device horizontally";}


        
        document.getElementById('orientationNotice').style.display = 'flex';
        document.getElementById('orientationNotice').style.justifyContent = 'center';
        document.getElementById('orientationNotice').style.alignItems = 'center';
    }
}

// function isMobileDevice() {
//     return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
// }

window.addEventListener('load', detectOrientation);
window.addEventListener('resize', detectOrientation);


const carCanvas = document.getElementById("carCanvas");
carCanvas.width= 200;


const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width= 300;


const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");


const road = new Road(carCanvas.width/2,200); // canvas.width



let N =20;
if(localStorage.getItem("carNumber")){
    N = parseInt(localStorage.getItem('carNumber'));
}

// single car
// const car = new Car(road.getLaneCenter(2),100,30,50,"AI",3);
// if(localStorage.getItem("bestBrain")){
//     bestCar.brain=JSON.parse(
//         localStorage.getItem("bestBrain"));
// }
// multiple cars
let cars = generateCars(N,"AI");
if(localStorage.getItem("userControlType")){
    const controlTypebutton = document.getElementById("toggleHuman");
    if (localStorage.getItem("userControlType") === "keyboard") {
        controlTypebutton.textContent = 'AI🧠';
        cars = generateCars(1,"KEYS");

    }
}

console.log("self"+N);
let bestCar = cars[0];
console.log(bestCar.brain);

if(localStorage.getItem("bestBrain")){
    for(let i=0;i<cars.length;i++){
        cars[i].brain = JSON.parse(
            localStorage.getItem("bestBrain"));
            if(i!=0){
                NeuralNetwork.mutate(cars[i].brain,0.2);
            }
    }

}

let traffic=[
    new Car(road.getLaneCenter(1),-100,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(3),-300,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(2),-300,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(3),-500,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(1),-500,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(1),-700,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(2),-700,30,50,"DUMMY",2),
];
// Check if there's traffic data in localStorage
if (localStorage.getItem("traffic")) {
    traffic= [];
    // Retrieve traffic data from localStorage
    const parsedTraffic = JSON.parse(localStorage.getItem("traffic"));

    //Populate traffic array with parsed data
    for (let i = 0; i < parsedTraffic.length; i++) {
        traffic.push(new Car(parsedTraffic[i].x, parsedTraffic[i].y, 30, 50, "DUMMY",parsedTraffic[i].maxSpeed));
    }
}

animate();


function save(){
    localStorage.setItem("bestBrain",JSON.stringify(bestCar.brain));
    
}

function discard(){
    localStorage.removeItem("bestBrain");
    refresh();
}

// Function to handle refresh button click
function refresh() {
    // Reload the page to refresh the content
    location.reload();
}

// Function to handle pause button click
function toggleAddCars() {
    N+=20;
    localStorage.setItem("carNumber",N);
    // Reload the page to refresh the content
    location.reload();

}


function toggleDeleteCars() {
    let N = parseInt(localStorage.getItem("carNumber")) || 0;
    N -= 20;
    if (N < 1) {
        N = 1;
        const deleteCarButton = document.getElementById("deleteCarButton");
        deleteCarButton.style.transition = "background-color 0.5s ease";
        deleteCarButton.style.backgroundColor = "red";
        localStorage.setItem("carNumber", N);
    } else {
        localStorage.setItem("carNumber", N);
        location.reload();
    }
}


// Function to save it to PC
function saveObjectToFile() {
    const objectData = localStorage.getItem("bestBrain");
    const fileName = "bestBrain.json";
    
    const dataUri = "data:application/json," + encodeURIComponent(objectData);
    
    const a = document.createElement("a");
    a.href = dataUri;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


// Function to load object from file
function loadObjectFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = function(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(event) {
            const loadedData = event.target.result;
            localStorage.setItem("bestBrain", loadedData);
            alert("AI loaded successfully!");
            refresh();
        }

        reader.readAsText(file);
    };

    input.click();
}

// Function to check if two cars intersect
function intersectsWith(car1, car2) {
    return !(car1.initialX + car1.width < car2.initialX ||
             car2.initialX + car2.width < car1.initialX ||
             car1.initialY + car1.height < car2.initialY ||
             car2.initialY + car2.height < car1.initialY);
}

function toggleText() {
    const controlTypebutton = document.getElementById("toggleHuman");
   
    if (controlTypebutton.textContent === '⌨️') {
        controlTypebutton.textContent = 'AI🧠';
        localStorage.setItem("userControlType","keyboard");

    }
    else
    {
        controlTypebutton.textContent= '⌨️';
        localStorage.setItem("userControlType","AI");
    }
    refresh();
  }

function addDummyCar() {
    // Check for intersection with other traffic
    let intersects = false;
    let attemptsReached = false;
    const aiCar = new Car(road.getLaneCenter(2), 100, 30, 50, "AI");
    let failedAttempts =0;

    // Find the maximum Y-coordinate in the existing traffic array using spread operator and Math.min
    let maxNegY =0;
    if(traffic){
        maxNegY = Math.min(...traffic.map(car => car.initialY));
    }
    
    console.log("maxNegY",maxNegY);

    do {
        intersects = false; // Reset intersects to false at the beginning of each iteration
        const randomLaneNumber = Math.floor(Math.random() * 3) + 1;
        const newX = road.getLaneCenter(randomLaneNumber); // Randomize x-coordinate around lane center
        const randomYNumber = Math.floor(Math.random() * (200)); // Generates random number between 0 and 200
        const randomYInRange = -randomYNumber +maxNegY;
        console.log(randomYInRange);
        const carWidth = 30;
        const carHeight = 50;
        const MINIMUM_DISTANCE =50;
        


        // Create a dummy car with the new position
        const newCar = new Car(newX, randomYInRange, carWidth, carHeight, "DUMMY", 2);

        // Check for intersection with AI car
        if (intersectsWith(newCar, aiCar)) {
            console.log("ai Intersection found!");
            
            failedAttempts+=1;

            if (failedAttempts >= 1) {
                console.log("too much attempts");
                attemptsReached = true;
            }
          
            break; // Exit the loop and generate a new car
        }
        
        // Check for intersection with other cars
        for (let i = 0; i < traffic.length; i++) {
            console.log("Before intersection check:", intersects);
           
            if (intersectsWith(newCar, traffic[i])|| Math.abs(newCar.y - traffic[i].y) < MINIMUM_DISTANCE) {
                intersects = true;
                console.log("Intersection found!");
                failedAttempts+=1;
                if (failedAttempts >= 3) {
                    console.log("too much attempts");
                    attemptsReached = true;
                }
        
                break;
            }
            console.log("After intersection check:", intersects);

        }


        

        if (!intersects) {
            // If the new car does not intersect with existing traffic, add it to the traffic array
            traffic.push(newCar);

            // Serialize and save updated traffic array to localStorage
            const serializedTraffic = traffic.map(car => car.toJSON());
            localStorage.setItem('traffic', JSON.stringify(serializedTraffic));
            // Reload the page to refresh the content
            // location.reload();
        }
    } while (intersects && !attemptsReached); // Continue looping until a non-intersecting position is found

    // Reload the page
    refresh();
}


function removeDummyCar() {
    
    traffic.pop();
    
    // Serialize and save updated traffic array to localStorage
    const serializedTraffic = traffic.map(car => car.toJSON());
    localStorage.setItem('traffic', JSON.stringify(serializedTraffic));


    // // old way no serialize
    // // localStorage.setItem('traffic', JSON.stringify(traffic));
    

    // Reload the page
    refresh();
  

}


function restartGame(){

    localStorage.removeItem("traffic");
    // Reload the page
    refresh();
}








function generateCars(N,controlType){
    const cars=[];
    for(let i=1;i<=N;i++){
        cars.push(new Car(road.getLaneCenter(2),100,30,50,controlType));

    }
    return cars;
}



function animate(time){

    
    for(let i=0;i<traffic.length;i++){
        traffic[i].update(road.borders,[]);
    }
    
    for(let i=0;i<cars.length;i++){
        cars[i].update(road.borders,traffic);
    }

    //best car
    bestCar = cars.find
    (c=>c.y == Math.min(...cars.map(c=>c.y)));


    // single car
    // update canvas when car is updated
    // cars.update(road.borders,traffic);
    carCanvas.height = window.innerHeight;
    networkCanvas.height= window.innerHeight;

    //save() restore() only affect the car and road
    //make the canvas origin coordinate be the car center
    carCtx.save();

    //the translate make the road moving
    carCtx.translate(0,-bestCar.y+carCanvas.height*0.5);

    road.draw(carCtx);



    for(let i=0;i<traffic.length;i++){
        traffic[i].draw(carCtx,"red");

    }

    //multiple cars
    carCtx.globalAlpha = 0.2;
    for(let i=0;i<cars.length;i++){
        cars[i].draw(carCtx,"blue");
    }
    //individual car
    // car.draw(carCtx,"blue");
    carCtx.globalAlpha = 1;

    bestCar.draw(carCtx,"blue",true);




    carCtx.restore();

    
    //AI Visualizer
    networkCtx.lineDashOffset=-time/50;
    console.log(bestCar.brain);
    Visualizer.drawNetwork(networkCtx,bestCar.brain);
  
    
    requestAnimationFrame(animate);

}