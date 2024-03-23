class Car{
    constructor(x,y,width,height,controlType,maxSpeed=3){
        this.initialX = x; // Store the initial X coordinate
        this.initialY = y; // Store the initial Y coordinate
        this.x = x;
        this.y= y;
        this.width = width;
        this.height= height;

        this.speed = 0;
        this.accerlation=0.2;
        this.maxSpeed= maxSpeed;
        this.friction=0.05;
        this.angle=0;
        this.damaged= false;

        this.useBrain = controlType =="AI";
        if(controlType!="DUMMY"){
             this.sensor = new Sensor(this);
             //[AI] part
             this.brain = new NeuralNetwork
             ([this.sensor.rayCount,6,4]);
        };
       
        this.controls= new Controls(controlType);
    }

    resetCarPosition(){
        this.x = this.initialX;
        this.y = this.initialX;
    }

    update(roadBorders,traffic){
        if(!this.damaged){
            this.#move();

            this.polygon= this.#createPolygon();
            //check damaged
            this.damaged= this.#assessDamage(roadBorders,traffic);
    
        }
        if(this.sensor){
            this.sensor.update(roadBorders,traffic);
            // [AI] REAL SENSOR WORKED HERE
            const offsets = this.sensor.readings.map(s=>s==null?0:1-s.offset);
            
            const outputs = NeuralNetwork.feedForward(offsets,this.brain);
            

            // [AI]
            if(this.useBrain){
                this.controls.forward=outputs[0];
                this.controls.left=outputs[1];
                this.controls.right=outputs[2];
                this.controls.reverse=outputs[3];

            } 

        }
      
   
       


    }
    
    #assessDamage(roadBorders,traffic){
        for(let i =0;i<roadBorders.length;i++){
            if(polysIntersect(this.polygon,roadBorders[i])){
                return true;
            }
        }
        for(let i =0;i<traffic.length;i++){
            if(polysIntersect(this.polygon,traffic[i].polygon)){
                return true;
            }
        }
        return false;
        
    }

    #createPolygon(){
        const points=[];
        const rad = Math.hypot(this.width,this.height)/2;
        const alpha= Math.atan2(this.width,this.height);
        points.push({
            //top right
            x:this.x-Math.sin(this.angle-alpha)*rad,
            y:this.y-Math.cos(this.angle-alpha)*rad
        });
        points.push({
            //bot right
            x:this.x-Math.sin(this.angle+alpha)*rad,
            y:this.y-Math.cos(this.angle+alpha)*rad
        });
        points.push({
            //top left
            x:this.x-Math.sin(Math.PI+this.angle-alpha)*rad,
            y:this.y-Math.cos(Math.PI+this.angle-alpha)*rad
        });
        points.push({
            //bot left
            x:this.x-Math.sin(Math.PI+this.angle+alpha)*rad,
            y:this.y-Math.cos(Math.PI+this.angle+alpha)*rad
        });
        return points;
    }

    #move(){
        if(this.controls.forward){
            this.speed+=this.accerlation;
        }
        if(this.controls.reverse){
            this.speed-=this.accerlation;
        }
        
        
        if(this.speed>this.maxSpeed){
            this.speed =this.maxSpeed;
        }
        
        if(this.speed<-this.maxSpeed/2){
            this.speed = -this.maxSpeed/2;
        }
        
        if(this.speed>0){
            this.speed -= this.friction;
        }
        if(this.speed<0){
            this.speed += this.friction;
        }
        if(Math.abs(this.speed)<this.friction){
            this.speed=0;
        }

        // left/right turn in unrelistic way
        // if(this.controls.left){
        //     this.x-=2;
        // }
        // if(this.controls.right){
        //     this.y+=2;
        // }

        //this outer if condition and flip constant here  
        //fix the reverse turn only allowed in speed 0
        if(this.speed!=0){
               const flip= this.speed>0?1:-1;
            if(this.controls.left){
                this.angle+= 0.03*flip;
            }
            if(this.controls.right){
                this.angle-= 0.03*flip;
            }
        }


        this.x-=Math.sin(this.angle)*this.speed;
        this.y-=Math.cos(this.angle)*this.speed;

    }
    

    draw(ctx,color,drawSensor = false){

        //old way to draw the car
        //we do save here bc only affect the car
        // ctx.save();
        // ctx.translate(this.x,this.y);
        // ctx.rotate(-this.angle);
        // ctx.beginPath();
        // ctx.rect(
        //     -this.width/2,
        //     -this.height/2,
        //     this.width,
        //     this.height
        // );
        // ctx.fill();
        // ctx.restore();

        //change car color if damaged
        if(this.damaged){
            ctx.fillStyle = "grey";
        }else{
            ctx.fillStyle = color;
        }

        //new way to draw car
        ctx.beginPath();
        ctx.moveTo(this.polygon[0].x,this.polygon[0].y);
        for(let i =1;i< this.polygon.length;i++){
            ctx.lineTo(this.polygon[i].x,this.polygon[i].y);}
        ctx.fill();

        if(this.sensor && drawSensor){
            this.sensor.draw(ctx);
        }
       

        

    }

    // Method to convert Car instance to plain object
    toJSON() {
        return {
            x:this.initialX,
            y:this.initialY,
            initialX: this.initialX,
            initialY: this.initialY,
            width: this.width,
            height: this.height,
            controlType: this.type,
            maxSpeed: this.maxSpeed,
        };
    }

    // Static method to create Car instance from plain object
    static fromJSON(json) {
        return new Car(json.initialX, json.initialY, json.width, json.height, json.controlType, json.maxSpeed);
    }
VG;

}