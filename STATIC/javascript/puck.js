////////////////////////////////////////////////////////////////////////////////
// Puck Problem implmenentation code, By Jared Mayron
//
// This class takes in a delaunay triangulation and returns a pathable data structure
//
//
// Main Methods:
//  Build:  "value", Creates a data structure representing the delaunay triangulation
//
//          Additional Vertex Properties: 
//            isLeftMost: the leftmost point in the triangulation
//            edges: all edges coming out of this vertex
//            radius: how big the radius is
//            startpuck: if the path starts from there
//
//          Additional Edge Properties:
//            slope: the slope to the first to second vertex
//            distance: the euclidean distance between to the two ends
//            passable: if the puck can pass through this edge
//            neighbors: triangles bordering the edge
//
//          Additional Triangle Properties:
//            edges: all 3 edges of the triangles
//            passable: if the puck can possibly pass through the triangulation
//            
////////////////////////////////////////////////////////////////////////////////

(function(global) {

  var infinity = 1e12;
  //Eacg instance has a canvas
  this.canvas = null;

//Takes in the triangulation, the startpuck and the pucksize, and the canvas dimensions
//returns a modified triangulation
  function build(triangles,startPuck,pucksize,canvas){
    //Edges Cases
    if(triangles == null){return triangles;}
    if(triangles.leghth == 0){return triangles;}
    this.canvas = canvas;

  
    //Clean and modify exisiting delaunay for our purposes
    triangles.forEach(function(triangle) {
      var vertexes = [triangle.v0,triangle.v1,triangle.v2];

      triangle.edges = [];
      triangle.passable = false;

      //Goes throught the verticies
      for(var i=0;i<vertexes.length;i++){
        var vertex = vertexes[i];
        vertex.isLeftMost = false;
        vertex.edges = new EdgeSet();
        //Defaults pucksize to the radius
        if(!vertex.radius){
          vertex.radius = pucksize;
        }
      }

    });

    //Build the structure given a delaunay triangulation
    var leftwaredVertex = null;
    var es = new EdgeSet();
    triangles.forEach(function(triangle) {

      //Values for the passage
      var edgePass = pucksize*2;
      var trianglePass = pucksize;

      var vertexes = [triangle.v0,triangle.v1,triangle.v2];

      //Retrieve and create edges
      var e0 = es.get(triangle.v0,triangle.v1);
      if(e0 == null){
        //If no edge exists yet creaate a new one
        e0 = new Edge(triangle.v0,triangle.v1);
        e0.distance = dist(triangle.v0,triangle.v1);
        e0.passable = e0.distance>(edgePass+triangle.v0.radius+triangle.v1.radius);
        e0.neighbors.push(triangle);
        es.add(e0);
      } else {
        e0.neighbors.push(triangle);
      }

      //Same with the second edge
      var e1 = es.get(triangle.v0,triangle.v2);
      if(e1 == null){
        e1 = new Edge(triangle.v0,triangle.v2);
        e1.distance = dist(triangle.v0,triangle.v2);
        e1.passable = e1.distance>(edgePass+triangle.v0.radius+triangle.v2.radius);
        e1.neighbors.push(triangle);
        es.add(e1);
      } else {
        e1.neighbors.push(triangle);
      }

      //And the third edge
      var e2 = es.get(triangle.v1,triangle.v2);
      if(e2 == null){
        e2 = new Edge(triangle.v1,triangle.v2);
        e2.distance = dist(triangle.v1,triangle.v2);
        e2.passable = e2.distance>(edgePass+triangle.v1.radius+triangle.v2.radius);
        e2.neighbors.push(triangle);
        es.add(e2);
      } else {
        e2.neighbors.push(triangle);
      }

      //Add adjacent edges for each of the verticies (each vertex starts with 2, but it can build up depending on the structure)
      triangle.v0.edges.add(e0);
      triangle.v0.edges.add(e1);

      //Same with second vertex
      triangle.v1.edges.add(e0);
      triangle.v1.edges.add(e2);

      //And the third vertex
      triangle.v2.edges.add(e1);
      triangle.v2.edges.add(e2);

      //Each triangle has 3 edges
      triangle.edges = [];
      triangle.edges.push(e0);
      triangle.edges.push(e1);
      triangle.edges.push(e2);

      //If the equidistant point (the circumcenter) cannot be passes [assumes equal weights] then the triangle is unpassable
      triangle.passable = triangle.minimumClearence()>trianglePass;

      //Search for the starting puck
      if(startPuck != null){
        //sets the startpuck value for every puck
        for(var i=0;i<vertexes.length;i++){
          var vertex = vertexes[i];
          if(startPuck.equals(vertex)){
            vertex.startPuck = true;
          } else {
            vertex.startPuck = false;
          }
        }
      }


    });
  //Finds the covex hull by finding all the edges, finding all the edges with 1 neighboring triangle, since the other neighbor has to be the outside
  var allEdges = es.values();
  for(var index=0;index<allEdges.length;index++){
    var edge = allEdges[index];

    if(edge.neighbors.length<2){
      edge.outside = true;
    } else {
      edge.outside = false;
    }
  }
  

  return triangles;
  }

  //Given, a set of triangles with verticies with exactly 1 of those verticies being a start vertex
  //Returns a path of escape
  function path(triangles,startPuck,canvas){
    var path = [];
    if(startPuck.edges == null){return path;}

    //Gets all the edges associated with the starting puck
    var startingEdges = startPuck.edges.values();

    //Sorts based off the heuristic
    startingEdges.sort(function(a,b){
        return justAnotherGreedyHeuristic(a,b);
    });
    startingEdges.reverse();

    //Finds all the triangles associated with the edges connected to the puck, these triangles are first on the search
    var startingTriangles = [];
    var startingTrianglesCheck = {};

    //Iterate through every edge, finding all the triangles neighboring the point
    for(var edgeIndex=0;edgeIndex<startingEdges.length;edgeIndex++){
      var edge = startingEdges[edgeIndex];
      var otherVertex = followEdge(startPuck,edge);

      if(edge.outside && edge.passable){
        //If the point is one hop from the edge of the tirangle, then return it
        return path;
      }
      if(edge.distance<(edge.v0.radius+edge.v1.radius)){
        //If the puck is illegally placed inside of another puck
        return path;
      }

      //Iterate through all the triangles
      for(var triangleIndex=0;triangleIndex<edge.neighbors.length;triangleIndex++){
        path = [startPuck];
        var triangle = edge.neighbors[triangleIndex];

        //Removes dulicates
        if(triangle.id in startingTrianglesCheck){continue;}

        //Adds it to a list to check
        startingTriangles.push(triangle);
        startingTrianglesCheck[triangle.id] = true;
      }
    }

    //Iterates though the triangles again
    for(var triangleIndex=0;triangleIndex<startingTriangles.length;triangleIndex++){
      //Starts the path on the puck's start
      path = [startPuck]; 
      var triangle = edge.neighbors[triangleIndex];

      if(triangle == null){return path;}
      triangle.explored = true;

      //Add this edge to the list
      path.push(edge.midpoint());

      //Call the subroutine
      path = pathHelper(triangle,path,canvas);

      //If the subroutine found a path
      if(path != null){

        //Clean the path
        var cleanPath = []
        if(!this.canvas){return path;}
        for(var index=0;index<path.length;index++){
          var vertex = path[index];
          cleanPath.push(vertex);
          //If somehow the center is outside the borders of the canvas, end
          if(minimumManhattanToEdges(vertex,this.canvas)<0){break;}
        }
        return cleanPath;
      }
    }


    return [];
  }

//Recursive function that paths from the starting triangles
  function pathHelper(triangle,path){
    //Marks the triangle as explored, the algorithm only explores explored triangles
    if(path==null){return null;}
    triangle.explored = true;
    var edgesToExplore = [];

    //For all the edges of the current triangle
    for(var index=0;index<triangle.edges.length;index++){

      //For each of the triangles get the neigbors
      var edge = triangle.edges[index];
      var neighborTriangle = getNeighborTriangle(triangle,edge);

      //If the algorithm can 
      if(edge.passable && edge.outside){
        //Copies the current path
        var result = path.slice();
        result.push(edge.midpoint());
        return result;
      }

      //Explore this edge
      if(edge.passable && neighborTriangle.passable && !neighborTriangle.explored){
        edgesToExplore.push(edge);
      }
    }

    //If there are no more edges to explore terminate this recursion
    if(edgesToExplore == []){return null;}
    //prioritizes edges go explore baesed off the heuristic
      edgesToExplore.sort(function(a,b){
        return justAnotherGreedyHeuristic(a,b);
      });
    

    for(var index=0;index<edgesToExplore.length;index++){
      var edge = edgesToExplore[index];

      //Finds the neighboring triangle
      var neighborTriangle = getNeighborTriangle(triangle,edge);

      //Makes a new copy of the path to recurse off of
      var result = path.slice();
      var midpoint = edge.midpoint();
      

      result.push(midpoint);
      //Since obtuse trinalgles circumcenters exist outside the triangle, it would not yeild a canonical path in this instance
      //[Limitation of the algoritnm]
      if(!isObtuse(neighborTriangle)){
        result.push(neighborTriangle.center);
      }

      //Recurse again
      result = pathHelper(neighborTriangle,result);

      //If it produces a valid result, pass it down the stack
      if(result != null){
        return result;
      } 
    }

    //If no valid results are found, then terminate this recursion
    return null;
  }

  //JM Custom Classes 

  //Given edge, and a vertex on that edge, gives the other vertex
  function followEdge(vertex,edge){
    if(vertex.id == edge.v0.id){
      return edge.v1;
    } else if(vertex.id == edge.v1.id){
      return edge.v0;
    } else {
      return null;
    }
  }

  //Given a triangle and an edge, finds the other triangle and edge
  //If the edge is on the outside return null
  function getNeighborTriangle(triangle,edge){
    if(edge.neighbors.length <2){
      return null;
    } else if(edge.neighbors[0].id == triangle.id){
      return edge.neighbors[1];
    } else if(edge.neighbors[1].id == triangle.id){
      return edge.neighbors[0];
    } else {
      return null;
    }
  }


  //The DFS used first tries to get closest to the edge of the canvas, as quickly as possible
  //Used as a heuristic in the sort function, a & b elements in the sorted list
  //Only use if canvas is defined
  function justAnotherGreedyHeuristic(a,b){
    return (minimumManhattanToEdges(a.midpoint(),this.canvas)>minimumManhattanToEdges(b.midpoint(),this.canvas));
  }

  //Calculates the minimum manhatten distance to an edge
  function minimumManhattanToEdges(vertex,canvas){
    var bottom = canvas.height-vertex.y;
    var right = canvas.width-vertex.x;
    var verticalMin = 0;
    var horizontaMin = 0;

    if(bottom<vertex.y){
      verticalMin = bottom;
    } else {
      verticalMin = vertex.y;
    }

    if(right<vertex.x){
      horizontaMin = right;
    } else {
      horizontaMin = vertex.x;
    }

    if(horizontaMin<verticalMin){
      return horizontaMin;
    } else {
      return verticalMin;
    }
  }

  //Set sepecifically designed for vertexes
  function VertexSet() {
    var setObj = {}; 

    this.add = function(vertex) {
      if(this.contains(vertex)){
        return false;
      }

      setObj[[v0.x,v1.y]] = vertex;
      return true;
    };

    this.contains = function(vertex) {
      if(setObj[[vertex.x,vertex.y]] == null){
        return false;
      }
      return true; 
    };

    this.get = function(vertexX,vertexY) {
      if(setObj[[vertex.x,vertex.y]] == null){
        return new Vertex
      }
      return setObj[[vertexX,vertexY]];
    };
  }

  //Given 2 vertexes, find the distance
  function dist(vertex1,vertex2){
    var dx = vertex1.x - vertex2.x;
    var dy = vertex1.y - vertex2.y;
    return Math.sqrt(dx*dx + dy*dy);
  }


  //Modified for Stackoverflow
  function angleInRads(Edge1,Edge2){
    var AB = Edge1.distance;
    var BC = Edge2.distance;

    var AC;
    if(Edge1.v0.id == Edge2.v0.id){
      AC = dist(Edge1.v1,Edge2.v1);
    } else if(Edge1.v1.id == Edge2.v1.id){
      AC = dist(Edge1.v0,Edge2.v0);
    } else if (Edge1.v0.id == Edge2.v1.id){
      AC = dist(Edge1.v1,Edge2.v0);
    } else if (Edge1.v1.id == Edge2.v0.id){
      AC = dist(Edge1.v0,Edge2.v1);
    } else {
      return 0;
    }
    return Math.acos((BC*BC+AB*AB-AC*AC)/(2*BC*AB));
  }

  //Given, an edge, returns the angle maded by this edge to a 0,1 vertical line from the lowest point on the edge
  function angleFromPlumbline(Edge){
    var AB = Edge.distance;
    var BC = 1;

    var AC;
    if(Edge.v0.y<Edge.v1.y){
      AC = dist(new Vertex(Edge.v0.x,Edge.v0.y-1),Edge.v1);
    } else {
      AC = dist(Edge.v0,new Vertex(Edge.v1.x,Edge.v1.y-1));
    }
    return Math.acos((BC*BC+AB*AB-AC*AC)/(2*BC*AB));
  }

  //Given a triangle finds if it's obtuse
  function isObtuse (triangle){
    //The logest edge in the triangle is oppose the largest angle
    var logestEdge = null;

    //Used if 2 edges are equal
    var checked = false;

    //Distance stores
    var maximumDistance = 0;
    var totalSquaredDistance = 0;

    //Goes through the edges and finds the maximum edge
    for(var index=0;index<triangle.edges.length;index++){
      var edge = triangle.edges[index];
      edge.distance = dist(edge.v0,edge.v1);
      if(edge.distance>maximumDistance){
        maximumDistance = edge.distance;
        logestEdge = edge;
      }
    }

    //Compares the square of the leghth of the longest edge to sum of the squares of the 2 shorter edges
    //If a^2 + b^2 < c^2 then the triangle is obtuse
    for(var index=0;index<triangle.edges.length;index++){
      var edge = triangle.edges[index];
      if(edge.distance==maximumDistance && !checked){
        checked = true;
      } else {
        totalSquaredDistance += edge.distance*edge.distance;
      }
    }
    return (totalSquaredDistance<(maximumDistance*maximumDistance));



  }

  global.build = build;
  global.path = path;
  global.followEdge = followEdge;



}(self));