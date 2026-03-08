let canvas, S
let conf = {
	w : 800,
	h : 800,
	N : 200, 
	zoom : 1,
	innerRadius : 10,
	outerRadius : 25,
	cohesion : 1,
	separation : 1,
	alignment : 1
}

class Canvas {
	constructor( Scene, conf ){
		this.zoom = conf.zoom
		this.S = Scene
		this.height = this.S.h
		this.width = this.S.w
		this.el = document.createElement("canvas")
		this.el.width = this.width*this.zoom
		this.el.height = this.height*this.zoom
		let parent_element = document.getElementById( "canvasModel" ) 
		parent_element.appendChild( this.el )
		
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

	rotateVector(v, angle){
	return [
		v[0]*Math.cos(angle) - v[1]*Math.sin(angle),
		v[0]*Math.sin(angle) + v[1]*Math.cos(angle)
	]
	}


drawVisionCone(p) {
    const ctx = this.ctx;
    const zoom = this.zoom;

    const start = p.multiplyVector(p.pos, zoom); // center
    const radius = this.S.conf.outerRadius * zoom;
    const halfAngle = p.viewAngleDeg * Math.PI / 180;
    const angle = Math.atan2(p.dir[1], p.dir[0]);

    // Calculate the two boundary points
    const left = [
        start[0] + Math.cos(angle + halfAngle) * radius,
        start[1] + Math.sin(angle + halfAngle) * radius
    ];
    const right = [
        start[0] + Math.cos(angle - halfAngle) * radius,
        start[1] + Math.sin(angle - halfAngle) * radius
    ];

    // Draw the filled area between the lines
    ctx.beginPath();
    ctx.moveTo(start[0], start[1]); // center
    ctx.lineTo(left[0], left[1]);   // left edge
    ctx.lineTo(right[0], right[1]); // right edge
    ctx.closePath();                 // back to center
    ctx.fillStyle = "rgba(0, 170, 0, 0.2)";
    ctx.fill();

    // Optional: draw the lines on top
    ctx.strokeStyle = "#00aa00";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(start[0], start[1]);
    ctx.lineTo(left[0], left[1]);
    ctx.moveTo(start[0], start[1]);
    ctx.lineTo(right[0], right[1]);
    ctx.stroke();
}
	
	drawSwarm(){
		this.background( "eaecef" )
		const showVision = document.getElementById("Enable Vision Angle").checked
		for( let p of this.S.swarm ){
			this.fillCircle( p.pos, "ff0000" )

			if(showVision){
				this.drawVisionCone(p)
				this.drawCircle( p.pos, "aaaaaa", this.S.conf.outerRadius )
			}
			else{
				this.drawCircle( p.pos, "aaaaaa", this.S.conf.outerRadius )
			}
		
		}
		this.drawDirections()
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

	inFieldOfView(p){
		let wrapped = this.S.wrap(p.pos, this.pos)
		let toNeighbor = this.subtractVectors(wrapped, this.pos)
		toNeighbor = this.normalizeVector(toNeighbor)
		let dot = this.dir[0]*toNeighbor[0] + this.dir[1]*toNeighbor[1]
		return dot > this.viewAngle
}

	// ----------------
	// Alignment
	// ----------------

	alignment(neighbors){
		const showVision = document.getElementById("Enable Vision Angle").checked
		let steer = [0,0]

		if(neighbors.length === 0) return steer

		for(let p of neighbors){
			if(!this.inFieldOfView(p) && showVision) continue
			
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
		const showVision = document.getElementById("Enable Vision Angle").checked
		let center = [0,0]

		if(neighbors.length === 0) return center

		for(let p of neighbors){
			
			if(!this.inFieldOfView(p) && showVision) continue
			
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
		const showVision = document.getElementById("Enable Vision Angle").checked
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





function initialize(){
	
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
	Plotly.newPlot( 'myDiv', data, layout);


	
}

