var path = require('path'), fs=require('fs'), lineReader = require('readline');

function getFiles(startPath,filter){

    //console.log('Starting from dir '+startPath+'/');
    let fileArray = [];

    if (!fs.existsSync(startPath)){
        console.log("no dir ",startPath);
        return;
    }

    let files=fs.readdirSync(startPath);
    for(var i=0;i<files.length;i++){
        let filename=path.join(startPath,files[i]);
        let stat = fs.lstatSync(filename);
        if (filename.indexOf(filter)>=0) {
            fileArray.push(files[i]);
        };
    };

    return fileArray
};

function handleFile(files, index, tree) {
  let inter = lineReader.createInterface({input:fs.createReadStream(files[index])})
  let fileName = files[index].split(".")[0];
  tree[fileName] = [];
  let options = false;
  let optionIndex = 1;
  inter.on("line",(line) => {
    if (line == "--" && !options) {
      tree[fileName].push([{}]);
      options = true;
      optionIndex = 1;
    } else if (line.trim() == "--" && options) {
      options = false;
    } else if (line.startsWith("*") && options) {
      tree[fileName][tree[fileName].length-1][tree[fileName][tree[fileName].length-1].length-1].option = new Buffer(optionIndex + ".) " + line.substring(1)).toString('base64');
      optionIndex++;
    } else if (line.startsWith("-") && options) {
      tree[fileName][tree[fileName].length-1][tree[fileName][tree[fileName].length-1].length-1].result = new Buffer(line.substring(1)).toString('base64');
    } else if (line == '' && options) {
      tree[fileName][tree[fileName].length-1].push({});
    } else if (line != '' && !options) {
      tree[fileName].push(new Buffer(line).toString('base64'));
    }
  })
  inter.on("close",() => {
    index++;
    if (files[index] != null && files[index] != undefined) {
      tree = handleFile(files,index,tree);
      return tree;
    } else {
      end(tree);
    }
  })
}

function start() {
  let files = getFiles('../script','.script');

  let index = 0;
  handleFile(files,index,{});
}

function end(tree) {
  fs.writeFile("../dist/tree.js",`var branches = ${JSON.stringify(tree)}`,(err) => {
    if (err)
      console.log("There was a problem writing to the output file");
    else
      console.log("Compilation successful!");
  });
}

start();
