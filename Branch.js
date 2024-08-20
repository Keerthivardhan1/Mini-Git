class Branch {

    constructor(name) {
        this.name = name;
        this.children = [];
        this.commits = [];
    }

    addCommit(commit) {
        this.commits.push(commit);
    }

    getCommits(){
        return this.commits;
    }


}

module.exports = Branch;