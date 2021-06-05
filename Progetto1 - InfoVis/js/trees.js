/*
The drawing is composed by trees, each tree corresponds to a data-case described in the json data file.
Each tree is represented by two roots (small rects), a trunk (rect), a crown (circle) and two fruits (squares).
The only size of the roots (extracted from json) is the root height, whereas the width is fixed.
The size of the trunks (extracted from json) is the trunk height, whereas the width is fixed.
The size of the crowns (extracted from json) is the crown area; to draw the crowns the radius (obtained from the area) is used.
The size of the fruits (extracted from json) is the fruit area; to draw the fruits the side of the square is calculated from the area.
There are also a label and the x axis; the label describes wich features was clicked, namely the values of x coordinate (the y-axis is not required and is not necessary).
*/

var margin = {top: 20, right: 20, bottom: 30, left: 40};

var width = 1630 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

var svg = d3.select("svg");

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);


//The drawing contains only the x axis (drawn with the code below).

var xScale = d3.scaleLinear().rangeRound([60, width-110]); //range of x axis

// Initialize the axis
var xAxis = d3.axisBottom(xScale);

//Function to update the scale X domain, it takes as input a list of values that are the tree position on x axis
function updateXScaleDomain(ticks) {
	var lastTicksAxis = d3.max(ticks) + ((d3.max(ticks))/10); //the tick for the end of x axis (update whenever the axis is redrawn)
	ticks.push(lastTicksAxis); //add last tick to list of ticks
	xAxis.tickValues([0].concat(ticks)); //set the list of ticks on the x axis (from zero to lastTick); draw a tick in each position of trees
	xScale.domain([0, lastTicksAxis]); //update domain -> from 0 to maxVariable, lastTicks is used to separate the end of x axis and last tree
}

// A function to draw the x axis
heightX = height - 100; //separate the bottom of svg to x axis (under the x axis the roots must be drawn); heightX is the height from top to x axis
function drawXaxis(){
	svg.append("g")
		   .attr("transform",  "translate(0," + heightX + ")") 
		   .attr("class", "x axis")
		   .call(xAxis)
		   .attr("font-size", "12")
		   .attr("text-anchor","end") //label of ticks aligned on left side
		   .style("font-weight", 700);
}	


//draw the trees under the x coordinate label
var labelYposition = 105;
var maxTrunkHeight = labelYposition + 145;

// Initialize the ranges of the scale for all the variables, limit the size of all trees element in a certain range:
// in the case of very large data in json file, the ranges avoid drawings that exceed the dedicated area.
//trunks
var scaleYtrunkHeight = d3.scaleLinear().range([heightX, maxTrunkHeight]); // scale for y coordinate, invert d3.js y coordinate logica, now trunks increase from bottom to the top

//crowns
var scaleCrownArea = d3.scaleLinear().range([3000, 15000]);

//fruits
var scaleFruitArea = d3.scaleLinear().range([50, 250]);

//roots
var scaleRoot = d3.scaleLinear().range([20, 60]); 



//main function to draw all the trees and the description of x position
function drawingTrees(dataSet, position, label){

	//draw description of the x coordinate values
	svg.append("text")
	   .attr("transform", "rotate(0)")
       .attr("y", 80)
       .attr("x", 60)
       .attr("font-size","20px")
       .style("font-weight", 700)
       .text("X coordinate:");

	svg.append("text").attr("class", "lab")
	   .attr("transform", "rotate(0)")
       .attr("y", labelYposition)
       .attr("x", 60)
       .attr("font-size","20px")
       .style("font-weight", 700)
       .attr("fill", "blue")
       .text(label); //the first value of label is "default position"; then label shows wich feature is selected
  
    //list of positions that are the values of x coordinate of all the figures to draw
    //first values are default positions and after clicking on the figures, positionXaxis assumes the values of the feature selected
	var positonXaxis = position;	
	 
	//iterates on array positions, each tree(in sequence trunk,crown,fruit, root) takes a different position on x axis
	function treePositionXaxis(positionTree){
		var arrayPosition = positionTree;
		var currentPos = arrayPosition[counterX];
		counterX = counterX + 1; //increase the index used to extract position: each element of the same type (rect-circle ...) assumes a different position
		currentPos = xScale(currentPos); //map on the x-axis
		return currentPos;
	}
		

	/* generate trunks from json Data, trunks are represented by rects */

	scaleYtrunkHeight.domain([20, d3.max(dataSet, function(d) { return d.trunkHeight; })]);
	
	var trunkWidth = 18; //trunks width is fixed for all the trunk 
	
	var counterX = 0; //counter for extract x coordinate from array position, it is set to zero whenever a new type of element (rect-circle ...) is drawn 
	
	var trunks = svg.selectAll(".trunk")
		.data(dataSet)
		trunks.exit().remove();
		trunks.enter() 
		.append("rect")
		.attr("class", "trunk")
		.attr("width", trunkWidth)
		.attr("height", function(d) { return heightX - scaleYtrunkHeight(d.trunkHeight)}) //draw trunks above x axis
		.attr("x", function() { return treePositionXaxis(positonXaxis)})
		.attr("y", function(d) { return scaleYtrunkHeight(d.trunkHeight)})
		.attr("fill", "#996633")
		.attr("stroke-width", "1px") //black stroke to improve visualization
		.attr("stroke", "black")
		.on("click", function(d){
	    	console.log("trunk");
	    	console.log(this);
	  		orderTrunk(dataSet);}); //redraw all the trees
	    
	 //smooth transition
	 trunks.transition().duration(1000)
		.attr("width", trunkWidth)
		.attr("height", function(d) { return heightX - scaleYtrunkHeight(d.trunkHeight)}) 
		.attr("x", function() { return treePositionXaxis(positonXaxis)})
		.attr("y", function(d) { return scaleYtrunkHeight(d.trunkHeight)})
		.attr("fill", "#996633")
		.attr("stroke-width", "1px") 
		.attr("stroke", "black")


	/* generate crowns from json data, crowns are represented by circles */

	scaleCrownArea.domain([1500, d3.max(dataSet, function(d) { return d.crownArea; })]); // Set the input domain for the crowns

	//extract crown area from json file and calculate radius of the circles
	function calculateRadius(d){
		crownAreaExtract = scaleCrownArea(d.crownArea);
		var pi = 3.14;
		return Math.sqrt(crownAreaExtract/pi);
	}

	//move the center of the circles above the trunks
	function crownPosition(d){
		return crownYposition = scaleYtrunkHeight(d.trunkHeight) - calculateRadius(d);
	}

	counterX = 0; //set to zero to re-iterate x position array in treePositionXaxis() function

	var crowns = svg.selectAll(".crown")
		.data(dataSet)
		crowns.exit().remove();
		crowns.enter()
		.append("circle")
		.attr("class", "crown")
		.attr("r", function(d) { return calculateRadius(d)})
		.attr("cx", function() { return treePositionXaxis(positonXaxis) + (trunkWidth/2)}) //centering the circles in the center of the trunk
		.attr("cy", function(d) { return crownPosition(d)}) //move the circles above the trunks
		.attr("fill", "green")
		.attr("stroke-width", "1px")
		.attr("stroke", "black")
		.on("click", function(d){
	    	console.log("crown");
	    	console.log(this);
	  		orderCrown(dataSet);});

	crowns.transition().duration(1000)
		.attr("r", function(d) { return calculateRadius(d)})
		.attr("cx", function() { return treePositionXaxis(positonXaxis) + (trunkWidth/2)})
		.attr("cy", function(d) { return crownPosition(d)})
		.attr("fill", "green")
		.attr("stroke-width", "1px")
		.attr("stroke", "black");


	/* generate fruits from json data, fruits are represented by squares */

	scaleFruitArea.domain([10, d3.max(dataSet, function(d) { return d.fruitArea; })]); // Set the input domain for the fruits

	//move fruits in the crowns
	function deltaXfruit(d, fruit){
		var radius = calculateRadius(d);
		var side = Math.sqrt(scaleFruitArea(d.fruitArea));
		var deltaX = trunkWidth/2; //the center of the tree
		//in the crowns -> sx position = firstFruit, dx position = secondFruit
		if(fruit == "firstFruit"){
			deltaX = deltaX - (radius/2);
		}
		else{
			deltaX = deltaX + (radius/2) - side; //align fruit in the correct position
		} 
	    return deltaX;
	}

	counterX = 0; //set to zero to re-iterate x position array in treePositionXaxis() function

	var firstFruit = svg.selectAll(".firstFruit")
		.data(dataSet);
		firstFruit.exit().remove();
		firstFruit.enter()
		.append("rect")
		.attr("class", "firstFruit")
		.attr("width", function(d) { return Math.sqrt(scaleFruitArea(d.fruitArea))}) //side of square
		.attr("height", function(d) { return Math.sqrt(scaleFruitArea(d.fruitArea))}) //side of square
		.attr("x", function(d) { return treePositionXaxis(positonXaxis) + deltaXfruit(d, "firstFruit")}) //sx side
		.attr("y", function(d) { return crownPosition(d)}) // y coordinate of the fruit is the center of the crowns
		.attr("fill", "orange")
		.attr("stroke-width", "1px")
		.attr("stroke", "black")
		.on("click", function(d){
	    	console.log("firstFruit");
	    	console.log(this);
	  		orderFruit(dataSet);});
	    
	firstFruit.transition().duration(1000)
		.attr("width", function(d) { return Math.sqrt(scaleFruitArea(d.fruitArea))})
		.attr("height", function(d) { return Math.sqrt(scaleFruitArea(d.fruitArea))})
		.attr("x", function(d) { return treePositionXaxis(positonXaxis) + deltaXfruit(d, "firstFruit")})
		.attr("y", function(d) { return crownPosition(d)})
		.attr("fill", "orange")
		.attr("stroke-width", "1px")
		.attr("stroke", "black"); 


	//draw second fruit; counter set to zero to re-iterate x position array in treePositionXaxis() function
	counterX = 0;

	var secondFruit = svg.selectAll(".secondFruit")
		.data(dataSet);
		secondFruit.exit().remove();
		secondFruit.enter()
		.append("rect")
		.attr("class", "secondFruit")
		.attr("width", function(d) { return Math.sqrt(scaleFruitArea(d.fruitArea))})
		.attr("height", function(d) { return Math.sqrt(scaleFruitArea(d.fruitArea))})
		.attr("x", function(d) { return treePositionXaxis(positonXaxis) + deltaXfruit(d, "secondFruit")})
		.attr("y", function(d) { return crownPosition(d)})
		.attr("fill", "red")
		.attr("stroke-width", "1px")
		.attr("stroke", "black")
		.on("click", function(d){
	    	console.log("secondFruit");
	    	console.log(this);
	  		orderFruit(dataSet);});

	secondFruit.transition().duration(1000)
		.attr("width", function(d) { return Math.sqrt(scaleFruitArea(d.fruitArea))})
		.attr("height", function(d) { return Math.sqrt(scaleFruitArea(d.fruitArea))})
		.attr("x", function(d) { return treePositionXaxis(positonXaxis) + deltaXfruit(d, "secondFruit")})
		.attr("y", function(d) { return crownPosition(d)})
		.attr("fill", "red")
		.attr("stroke-width", "1px")
		.attr("stroke", "black"); 


	/* generate roots from json data, roots are represented by small rects */

	scaleRoot.domain([10, d3.max(dataSet, function(d) { return d.rootHeight; })]);

	var rootWidth = 3.5; //roots width is fixed for all the root

	//draw first root; counter set to zero to re-iterate x position array in treePositionXaxis() function
	counterX = 0; 

	var firstRoot = svg.selectAll(".firstRoot")
	.data(dataSet)
	firstRoot.exit().remove();	
	firstRoot.enter() 
	.append("rect")
	.attr("class", "firstRoot")
	.attr("width", rootWidth)
	.attr("height", function(d) { return scaleRoot(d.rootHeight)})
	.attr("x", function() { return treePositionXaxis(positonXaxis) + trunkWidth/2 - rootWidth - 1.5}) //first root on sx side of trunk
	.attr("y", heightX-1.5) //align root under the trunk, increase from X axis to bottom
	.attr("fill", "#bf8040")
	.on("click", function(d){
	    console.log("root");
	    console.log(this);
	  	orderRoot(dataSet);});
	
	firstRoot.transition().duration(1000)
			.attr("width", rootWidth)
			.attr("height", function(d) { return scaleRoot(d.rootHeight)})
			.attr("x", function() { return treePositionXaxis(positonXaxis) + trunkWidth/2 - rootWidth - 1.5})
			.attr("y", heightX-1.5)
			.attr("fill", "#bf8040");

	
	//draw second root, counter set to zero to re-iterate x position array
	counterX = 0;  

	var secondRoot = svg.selectAll(".secondRoot")
	.data(dataSet)
	secondRoot.exit().remove();	
	secondRoot.enter() 
	.append("rect")
	.attr("class", "secondRoot")
	.attr("width", rootWidth)
	.attr("height", function(d) { return scaleRoot(d.rootHeight)})
	.attr("x", function(d) { return treePositionXaxis(positonXaxis) + trunkWidth/2 + 1.5}) //second root on dx side
	.attr("y", heightX-1.5) //align root under the trunk
	.attr("fill", "#bf8040")
	.on("click", function(d){
	    console.log("root");
	    console.log(this);
	  	orderRoot(dataSet);});
	
	secondRoot.transition().duration(1000)
			.attr("width", rootWidth)
			.attr("height", function(d) { return scaleRoot(d.rootHeight)})
			.attr("x", function(d) { return treePositionXaxis(positonXaxis) + trunkWidth/2 + 1.5})
			.attr("fill", "#bf8040");


} //end of drawingTrees()



var fixedXpositionTree = [50,200,350,500,650,800,950,1100,1250,1400]; //inital position of trees: fixed through function treePositionXaxis()

//upload data from json file
d3.json("data/dataset.json")
	.then(function(data) {
		updateXScaleDomain(fixedXpositionTree); //the first domain
		drawXaxis(); //draw x axis for the first time
		drawingTrees(data, fixedXpositionTree, "Default position"); //data, position array, initial label
		/* Solved the overlap problem when trees are close to each other. 
	   	   Dom -> rect(trunk1), rect(trunk2), ... , circle(crown1), circle(crown2), ... , rect(fruit1), rect(fruit2), ... -> bad overlap
	       Dom after sorting by trunkHeight  -> rect(trunk1), circle(crown1), rect(fruit1), ... , rect(trunk2), circle(crown2), rect(fruit2), ... -> good overlap
		*/
		d3.selectAll("rect, circle").sort(function(a, b) {
       	 	return d3.descending(a.trunkHeight,b.trunkHeight);
   		});
   	})
	.catch(function(error) {
		console.log(error); // Some error handling here
  	});



/* these functions update the drawing when there are clicks on certain features */

//click on trunk
function orderTrunk(dataSet){
	trunkHeightList = dataSet.map(function(d){return d.trunkHeight}); //generate list used for ticks on x axis and for positions of the trees
	updateXScaleDomain(trunkHeightList); 
	svg.select(".x.axis").transition().duration(1000).call(xAxis);
	svg.selectAll(".lab").remove(); //remove previous label
	label = "Trunks height"; //update label of x axis
	drawingTrees(dataSet, trunkHeightList, label); //redraw trees
}

//click on crown
function orderCrown(dataSet){
	crownAreaList = dataSet.map(function(d){return d.crownArea});
	updateXScaleDomain(crownAreaList);
	svg.select(".x.axis").transition().duration(1000).call(xAxis);
	svg.selectAll(".lab").remove();
	label = "Crowns area";
	drawingTrees(dataSet, crownAreaList, label);
}


//click on fruits
function orderFruit(dataSet){
	fruitAreaList = dataSet.map(function(d){return d.fruitArea});
	updateXScaleDomain(fruitAreaList);
	svg.select(".x.axis").transition().duration(1000).call(xAxis);
	svg.selectAll(".lab").remove();
	label = "Fruits area";
	drawingTrees(dataSet, fruitAreaList, label);
}

//click on roots
function orderRoot(dataSet){
	rootHeightList = dataSet.map(function(d){return d.rootHeight});
	updateXScaleDomain(rootHeightList);
	svg.select(".x.axis").transition().duration(1000).call(xAxis);
	svg.selectAll(".lab").remove();
	label = "Roots height";
	drawingTrees(dataSet, rootHeightList, label);
}




