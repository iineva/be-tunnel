class People {
    constructor(name) { //构造函数
          this.name = name;
    }
    sayName() {
          console.log(this.name);
    }
}


var p = new People("Tom");
p.sayName();
