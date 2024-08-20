const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const Branch = require('./Branch');
const Commit = require('./Commit');

class MyGit {
    constructor() {
        const rootDir = process.cwd();
        this.gitDir = path.join(rootDir, '.mygit');
        this.objectsDir = path.join(this.gitDir, 'objects');
        this.fileAndLastCommitMap = path.join(this.gitDir , 'fileCommitMap.json');
        this.stagedFiles = {}; // Tracks the hashes of the files // not suitable 
        this.Branchs = [];
        this.currBranch = new Branch("head");

        // Initialize the repository
        if (!fs.existsSync(this.gitDir)) {
            fs.mkdirSync(this.gitDir);
            fs.mkdirSync(this.objectsDir);
            fs.writeFileSync(this.fileAndLastCommitMap ,  JSON.stringify({}));
        }
    }

    /*
     Compress, hash, and stage the file
    */
    commit(filePath) {
        const fullPath = path.resolve(filePath);

        console.log("fullPath : ", fullPath)

        if (!fs.existsSync(fullPath)) {
            console.log(`File ${filePath} does not exist.`);
            return;
        }

        const fileContent = fs.readFileSync(fullPath);
        const compressedContent = zlib.deflateSync(fileContent);

        const hash = crypto.createHash('sha1').update(compressedContent).digest('hex');

        // console.log("hash : " , hash);
        // if(!hash) return;
        


        const lastCommitMap = JSON.parse(fs.readFileSync(this.fileAndLastCommitMap, 'utf-8'));

        const previousHash = lastCommitMap[filePath];
        if ( previousHash && previousHash === hash) {
            console.log(`No changes detected in ${filePath}.`);
            return;
        }

        let commit = new Commit(hash);

        if(previousHash != undefined){
            this.displayChanges(previousHash , fileContent.toString('utf-8') , commit);
        }

        // this.stagedFiles[filePath] = hash;
        lastCommitMap[filePath] = hash;
        fs.writeFileSync(this.fileAndLastCommitMap , JSON.stringify(lastCommitMap));

        /*
            add the commit object to the branch
        */
        this.currBranch.commits.push(commit);

        const objectDir = path.join(this.objectsDir, hash.substring(0, 2));
        const objectPath = path.join(objectDir, hash.substring(2));

        if (!fs.existsSync(objectDir)) {
            fs.mkdirSync(objectDir);
        }

        fs.writeFileSync(objectPath, compressedContent);
        console.log(`on Branch ${this.currBranch.name}`);
        console.log(`Committed ${filePath} with hash ${hash}`);

        // console.log("commit changes = ", commit.changes);
        
    }

    checkout(name){
        const newBranch = new Branch(name);
        this.Branchs.push(newBranch);
        this.currBranch.children.push(newBranch);
        this.currBranch = newBranch;
    }

    getCompressedContent(hash){
        const objectDir = path.join(this.objectsDir, hash.substring(0, 2));
        const objectPath = path.join(objectDir, hash.substring(2));
        const compressedContent = fs.readFileSync(objectPath);
        return compressedContent;
    }

    decompress(ccontent){
        return zlib.inflateSync(ccontent).toString('utf-8');
    }


    catfilep(filepath){
        const fullPath = path.resolve(filepath);
        const hash = this.stagedFiles[filepath];

        if(hash){
            const compressedContent = this.getCompressedContent(hash);
            const decompressedContent = zlib.inflateSync(compressedContent).toString('utf-8');
            console.log(decompressedContent);
        }
        
    }

    pushOrigin(b){
        console.log(b);
    }

    displayChanges(hash, newContent , commit){
        // console.log("hash (disch): " , hash);
        
        const compressedContent = this.getCompressedContent(hash);
        const oldContent = this.decompress(compressedContent);

        // console.log("old = " , oldContent);
        // console.log("new = " , newContent);
        
        

        const oldLines = oldContent.split('\n');
        const newLines = newContent.split('\n');

        const n = oldLines.length;
        const m = newLines.length;

        let insertions=0, deletions =0;
        let commonlines =0;

        /*
            nset = stors the lines in newLines array
        */

        let nset = new Set(newLines); 

        // for(let line in newLines) nset.add(line);


        let start = -1 , end = -1;


        for(let i=0;i<n;i++) {
            const line = oldLines[i];
            if(nset.has(line)){
                commonlines += 1;
                if(start !== -1 && end !== -1){
                    // console.log("start , end  " , start , " " , end );
                    commit.addChange(start , end);
                    start = -1;
                    end = -1
                }
            }else{
                // console.log(" else block start , end  " , start , " " , end );
                if(start === -1) start = i;
                else end = i;
            }
        }

        if(start != -1 || end != -1 ){
            if(end == -1) end = n;
            if(start == -1) start = n;
            commit.addChange(start , end);
        }
        
        // console.log("commons = " , commonlines);
        // console.log(" n = " , n , " m = " , m);
        
        
        deletions = n - commonlines;
        insertions = m - commonlines; 

        console.log(`+ ${insertions} insertions`);
        console.log(`- ${deletions} deletions`);
        
    }

    doesHashExists(hash){
        const objectDir = path.join(this.objectsDir, hash.substring(0, 2));
        const objectPath = path.join(objectDir, hash.substring(2));
        if(fs.existsSync(objectPath)) return true;
        return false;
    }
}

const git = new MyGit();

const cmd = process.argv[2];

switch (cmd) {
    case "commit":
        git.commit(process.argv[3]);
        break;

    default:
        break;
}



// git.commit('./file.txt');

