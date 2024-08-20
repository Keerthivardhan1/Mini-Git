
class Commit {
    
    constructor(hash) {
        this.hash = hash;
        this.changes = [];
    }
    addChange(s , e){
        this.changes.push([s,e] );
        this.mergeIntervals(this.changes);
        // console.log("In Commit class = ", this.changes);
        
    }

    mergeIntervals(arr){
        arr.sort((a,b)=>a[0]-b[0]);
        let res = [];
        res.push(arr[0]);

        for(let i=1;i<arr.length;i++){
            const n = res.length;
            if(arr[i][0] < res[n-1][1] ){
                res[n-1][1] = Math.max(res[n-1][1] , arr[i][1]);
            }else{
                res.push(arr[i]);
            }
        }

        this.changes = res;
    }
}

module.exports = Commit;