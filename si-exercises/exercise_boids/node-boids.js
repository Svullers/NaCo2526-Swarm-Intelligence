const args = require('minimist')(process.argv.slice(2));
const fs = require( 'fs' )

/* =========  copy your Particle class here:   */



class Particle {

	constructor(Scene, i){

		this.S = Scene
		this.id = i

		this.pos = this.S.randomPosition()

		// direction vector (unit length)
		this.dir = this.S.randomDirection()

		this.acc = [0,0]

		this.speed = 1
		this.maxForce = 0.05

		this.viewAngleDeg = 150; // 45° forward
    	this.viewAngle = Math.cos(this.viewAngleDeg * Math.PI / 180); // for dot product
	}

	// ----------------
	// Vector utilities
	// ----------------

	addVectors(a,b){
		return [a[0] + b[0], a[1] + b[1]]
	}

	subtractVectors(a,b){
		return [a[0] - b[0], a[1] - b[1]]
	}

	multiplyVector(a,c){
		return [a[0] * c, a[1] * c]
	}

	normalizeVector(a){
		return this.S.normalizeVector(a)
	}

	limitForce(v){

		let n = this.normalizeVector(v)

		if(n[0] !== 0 || n[1] !== 0){
			return this.multiplyVector(n, this.maxForce)
		}

		return v
	}


	// ----------------
	// Alignment
	// ----------------

	alignment(neighbors){
		
		let steer = [0,0]

		if(neighbors.length === 0) return steer

		for(let p of neighbors){
			
			steer = this.addVectors(steer, p.dir)
		}

		steer = this.multiplyVector(steer, 1/neighbors.length)

		steer = this.normalizeVector(steer)
		steer = this.multiplyVector(steer, this.speed)

		let currentVel = this.multiplyVector(this.dir, this.speed)

		steer = this.subtractVectors(steer, currentVel)

		return this.limitForce(steer)
	}

	// ----------------
	// Cohesion
	// ----------------

	cohesion(neighbors){

		let center = [0,0]

		if(neighbors.length === 0) return center

		for(let p of neighbors){
			
			
			let wrapped = this.S.wrap(p.pos, this.pos)

			center = this.addVectors(center, wrapped)
		}

		center = this.multiplyVector(center, 1/neighbors.length)

		let desired = this.subtractVectors(center, this.pos)

		desired = this.normalizeVector(desired)
		desired = this.multiplyVector(desired, this.speed)

		let currentVel = this.multiplyVector(this.dir, this.speed)

		let steer = this.subtractVectors(desired, currentVel)

		return this.limitForce(steer)
	}

	// ----------------
	// Separation
	// ----------------

	separation(neighbors){

		let steer = [0,0]
		let count = 0

		for(let p of neighbors){


			let wrapped = this.S.wrap(p.pos, this.pos)

			let diff = this.subtractVectors(this.pos, wrapped)

			let d = this.S.dist(this.pos, wrapped)

			if(d > 0){

				diff = this.multiplyVector(diff, 1/d)

				steer = this.addVectors(steer, diff)

				count++
			}
		}

		if(count > 0){
			steer = this.multiplyVector(steer, 1/count)
		}

		if(steer[0] !== 0 || steer[1] !== 0){

			steer = this.normalizeVector(steer)
			steer = this.multiplyVector(steer, this.speed)

			let currentVel = this.multiplyVector(this.dir, this.speed)

			steer = this.subtractVectors(steer, currentVel)
		}

		return this.limitForce(steer)
	}

	// ----------------
	// Main update
	// ----------------

	

	updateVector(){

		let neighborsOuter = this.S.neighbours(this, this.S.conf.outerRadius)

		let neighborsInner = this.S.neighbours(this, this.S.conf.innerRadius)
		
		let align = this.alignment(neighborsOuter)
		let coh   = this.cohesion(neighborsOuter)
		let sep   = this.separation(neighborsInner)

		align = this.multiplyVector(align, this.S.conf.alignment)
		coh   = this.multiplyVector(coh, this.S.conf.cohesion)
		sep   = this.multiplyVector(sep, this.S.conf.separation)

		this.acc = [0,0]

		this.acc = this.addVectors(this.acc, align)
		this.acc = this.addVectors(this.acc, coh)
		this.acc = this.addVectors(this.acc, sep)

		this.acc = this.limitForce(this.acc)

		// update direction
		let vel = this.multiplyVector(this.dir, this.speed)

		vel = this.addVectors(vel, this.acc)

		this.dir = this.normalizeVector(vel)

		// move with constant speed
		this.pos = this.addVectors(
			this.pos,
			this.multiplyVector(this.dir, this.speed)
		)

		this.pos = this.S.wrap(this.pos)
	}

}


/* =========  you don't need to touch this bit. */

// Reading inputs from the console, helper function
function getInput( name, defaultValue, type = undefined ){
	
	if( !args.hasOwnProperty(name)) return defaultValue
	if( type === "boolean" ){ return true }
	else if( type === "int" ){
		if( args[name][0] == "m" ){
			return -parseInt(args[name].substring(1) )
		}
		return parseInt( args[name] ) 
	} 
	else if (type === "float" ){ return parseFloat( args[name] ) } 
	else { return args[name] }
}

const fieldsize = getInput( "f", 400, "int" ) // field size
const Nboids = getInput( "N", 50, "int" ) // number of boids
const inR = getInput( "i", 10, "int" ) // inner radius
const oR = getInput( "o", 25, "int" ) // outer radius
const wc = getInput( "c", 1, "float" ) // cohesion weight
const ws = getInput( "s", 1, "float" ) // separation weight
const wa = getInput( "a", 1, "float" ) // alignment weight
const runTime = getInput( "T", 1000, "int" ) // number of steps to run
const imgpath = getInput( "I", undefined, "string" ) // path to write images to

let saveImg = false

if( imgpath != undefined ){
	saveImg = true
	fs.mkdirSync(imgpath, { recursive: true })
}


let canvas, S
let conf = {
	w : fieldsize,
	h : fieldsize,
	N : Nboids, 
	zoom : 1,
	innerRadius : inR,
	outerRadius : oR,
	cohesion : wc,
	separation : ws,
	alignment : wa,
	runTime : runTime
}



class Canvas {
	constructor( Scene, conf ){
		this.zoom = conf.zoom
		this.S = Scene
		this.height = this.S.h
		this.width = this.S.w
		
		if( typeof document !== "undefined" ){
			this.el = document.createElement("canvas")
			this.el.width = this.width*this.zoom
			this.el.height = this.height*this.zoom
			let parent_element = document.getElementById( "canvasModel" ) 
			parent_element.appendChild( this.el )
		} else {
			const {createCanvas} = require("canvas")
			this.el = createCanvas( this.width*this.zoom,
				this.height*this.zoom )
			this.fs = require("fs")
		}
		
		
		this.ctx = this.el.getContext("2d")
		this.ctx.lineWidth = .2
		this.ctx.lineCap="butt"
		
	}
	
	background( col ){
		col = col || "000000"
		this.ctx.fillStyle="#"+col
		this.ctx.fillRect( 0,0, this.el.width, this.el.height )
	}
	
	fillCircle( pos, col ){
		this.ctx.fillStyle="#"+col
		this.ctx.beginPath()
		this.ctx.arc( pos[0], pos[1], this.S.conf.innerRadius/2, 0, 2 * Math.PI )
		this.ctx.stroke()
		this.ctx.fill()
	}
	
	drawCircle( pos, col, radius ){
		this.ctx.lineWidth = .5*this.zoom
		this.ctx.strokeStyle="#"+col
		this.ctx.beginPath()
		this.ctx.arc( pos[0], pos[1], radius * this.zoom, 0, 2 * Math.PI )
		this.ctx.stroke()
	}
	
	drawDirections(){
		this.ctx.strokeStyle="#000000"
		const ctx = this.ctx, zoom = this.zoom
		ctx.beginPath()
		ctx.lineWidth = 2*zoom
	
		for( let p of this.S.swarm ){
			
			const startPoint = p.multiplyVector( p.pos, zoom )
			
			let drawVec = p.multiplyVector( p.dir, this.S.conf.innerRadius * 1.2 * zoom )
			drawVec = p.addVectors( startPoint, drawVec )
				
			ctx.moveTo( startPoint[0], startPoint[1] )
			ctx.lineTo( drawVec[0], drawVec[1] )
		}
		ctx.stroke()		
	}
	
	drawSwarm(){
		this.background( "eaecef" )
		for( let p of this.S.swarm ){
			this.fillCircle( p.pos, "ff0000" )
			this.drawCircle( p.pos, "aaaaaa", this.S.conf.outerRadius )
		}
		this.drawDirections()
	}	
	
	writePNG( fname ){
 
		try {
			this.fs.writeFileSync(fname, this.el.toBuffer())
		}
		catch (err) {
			if (err.code === "ENOENT") {
				let message = "Canvas.writePNG: cannot write to file " + fname +
					", are you sure the directory exists?"
				throw(message)
			}
		}
 
	}
}


class Scene {
	
	constructor( conf ){
		this.w = conf.w
		this.h = conf.h 
		this.conf = conf
		this.swarm = []
		this.makeSwarm()
		this.time = 0
	}
	
	reset(){
		this.swarm = []
		this.time = 0
		this.makeSwarm()
	}
	
	getAngles(){
		let angles = []
		for( let p of this.swarm ){
			const ang = 180 + (180/Math.PI) * Math.atan2( p.dir[1], p.dir[0] )
			angles.push( ang )
		}
		return angles
	}

    getNeighbours() {
        let counts = [];
        const outerRadius = S.conf.outerRadius;
        for (let p of S.swarm) {
            let count = 0;
            for (let q of S.swarm) {
                if (p.id === q.id) continue;

                // compute wrapped distance
                let dx = Math.abs(p.pos[0] - q.pos[0]);
                if (dx > S.w/2) dx = S.w - dx;

                let dy = Math.abs(p.pos[1] - q.pos[1]);
                if (dy > S.h/2) dy = S.h - dy;

                let dist = Math.sqrt(dx*dx + dy*dy);
                if (dist <= outerRadius) count++;
            }
            counts.push(count);
        }
        return counts;
    }

    getOrderParameter(){
        let OrdParm = 0
        let sum_d = [0,0]
        for (let p of S.swarm){
            let d = p.dir
            let magnitude_d = Math.sqrt(d[0]**2 + d[1]**2)
            if(magnitude_d != 0) {
                sum_d = p.addVectors(sum_d, [d[0] / magnitude_d, d[1] / magnitude_d])
            }
            else{
                sum_d = p.addVectors(sum_d, [0, 0])
            }
        }	
        let magnitude_d = Math.sqrt(sum_d[0]**2 + sum_d[1]**2)
        if(magnitude_d == 0) {
            OrdParm = 0
        } else {
            OrdParm = (magnitude_d / S.swarm.length)
        }
        return OrdParm
    }

    getNearestNeighborDistance(p){
        let minDist = Infinity
        for (let q of S.swarm) {
            if (p.id === q.id) continue;

            // wrapped distance
            let dx = Math.abs(p.pos[0] - q.pos[0]);
            if (dx > S.w / 2) dx = S.w - dx;

            let dy = Math.abs(p.pos[1] - q.pos[1]);
            if (dy > S.h / 2) dy = S.h - dy;

            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) minDist = dist;
        }
        return minDist
    }

    getNearestNeighborDistances() {
        let distances = [];
        for (let p of S.swarm) {
            let minDist = Infinity;
            for (let q of S.swarm) {
                if (p.id === q.id) continue;

                // wrapped distance
                let dx = Math.abs(p.pos[0] - q.pos[0]);
                if (dx > S.w / 2) dx = S.w - dx;

                let dy = Math.abs(p.pos[1] - q.pos[1]);
                if (dy > S.h / 2) dy = S.h - dy;

                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDist) minDist = dist;
            }
            distances.push(minDist);
        }
        return distances;
    }
	
	wrap( pos, reference = undefined ){
	
		// wrapping without a reference: just make sure the coordinate falls within 
		// the space
		if( (typeof reference == 'undefined') ){
		
			if( pos[0] < 0 ) pos[0] += this.w
			if( pos[1] < 0 ) pos[1] += this.h
			if( pos[0] > this.w ) pos[0] -= this.w
			if( pos[1] > this.h ) pos[1] -= this.h
	
			return pos
		}

		// otherwise: make coordinates consistent compared to a reference position
		// we don't want to overwrite the 'pos' object itself (!JavaScript) so deep copy it first
		const pos2 = pos.slice()
		let dx =  pos2[0] - reference[0] , dy = pos2[1] - reference[1]
		if( dx > this.w/2 ) pos2[0] -= this.w
		if( dx < -this.w/2 ) pos2[0] += this.w
		if( dy > this.h/2 ) pos2[1] -= this.h
		if( dy < -this.h/2 ) pos2[1] += this.h
		
		
		return pos2
		
	}
	
	addParticle(){
		const i = this.swarm.length + 1
		this.swarm.push( new Particle( this, i ) )
	}
	
	makeSwarm(){
		for( let i = 0; i < this.conf.N; i++ ) this.addParticle()
	}
	
	randomPosition(){
		let x = Math.random() * this.w
		let y = Math.random() * this.h
		return [x,y]
	}
	
	randomDirection( dim = 2 ){
		let dir = []
		while(dim-- > 0){
			dir.push(this.sampleNorm())
		}
		this.normalizeVector(dir)
		return dir
	}
	
	normalizeVector( a ){
	
		if( a[0] == 0 & a[1] == 0 ) return [0,0]
	
		let norm = 0
		for( let i = 0 ; i < a.length ; i ++ ){
			norm += a[i]*a[i]
		}
		norm = Math.sqrt(norm)
		for( let i = 0 ; i < a.length ; i ++ ){
			a[i] /= norm
		}
		return a
	}
	
	sampleNorm(mu=0, sigma=1) {
		let u1 = Math.random()
		let u2 = Math.random()
		let z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(Math.PI*2 * u2)
		return z0 * sigma + mu
	}
	
	dist( pos1, pos2 ){
	
		let dx = pos1[0] - pos2[0]
		if( dx > this.w/2 ){ dx -= this.w }
		if( dx < (-this.w/2) ){ dx += this.w }
		
		let dy = pos1[1] - pos2[1]
		if( dy > this.h/2 ){ dy -= this.h }
		if( dy < ( -this.h/2 ) ){ dy += this.h }
		
		const dist = Math.sqrt( dx * dx + dy * dy )
		return dist
		//const dist = Math.hypot(pos2[0] - pos1[0], pos2[1] - pos1[1] )	
	}
	
	neighbours( x, distanceThreshold ){
		let r = []
		for( let p of this.swarm ){
			if( p.id == x.id ) continue 
			
			if( this.dist( p.pos, x.pos ) <= distanceThreshold ){
				r.push( p )
			}
		}
		return r
	}	
	
	step(){
		for( let p of this.swarm ){
			p.updateVector()
		}
		this.time++
	}
}


S = new Scene( conf )
canvas = new Canvas( S, conf )
canvas.drawSwarm()


let angles = []

let trace = {
    x: angles,
    type: 'histogram',
    };
let  data = [trace]
var layout = {
    xaxis: {range: [0, 2*Math.PI]}
};
// Plotly.newPlot( 'myDiv', data, layout);


let counts = []

let traceCounts = {
    x: counts,
    type: 'histogram',
    };
let  dataCounts = [traceCounts]
var layout = {
    xaxis: {range: [0, 200]}
};
// Plotly.newPlot( 'neighborDiv', dataCounts, layout)

	

if( saveImg ) canvas.writePNG( `${imgpath}/boids-t${S.time}.png` )

console.log( "time,id,x,y,nn_dis")

let ops = ["t,orderParam"]
let boids = ["t,id,x,y,nn_dis"]

for( let t = 0; t <= conf.runTime; t++ ){
	if( saveImg & t % 100 == 0 ){
		canvas.writePNG( `${imgpath}/boids-t${S.time}.png` )
	}
	
	S.step()
	canvas.drawSwarm()

    let op = S.getOrderParameter()
    ops.push(`${S.time},${op}`)


    
	// log positions to the console
	for( let p of S.swarm ){
        let nn_dis = S.getNearestNeighborDistance(p)
		let log = [ S.time, p.id, p.pos[0], p.pos[1], nn_dis ]
        boids.push(`${S.time},${p.id},${p.pos[0]},${p.pos[1]},${nn_dis}`)
		console.log( log.join(",") )
	}
	
}

fs.writeFileSync('csvs/order-parameters.csv', ops.join("\n"))
fs.writeFileSync('csvs/boids.csv', boids.join("\n"))

