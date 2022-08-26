// const url = "https://www.youtube.com/watch?v=OHr1JofrigY";

// const regex = new RegExp(/[a-z0-9\-\_]{1,}/);
// const handle = url
//   .split("/")
//   [url.split("/").length - 1].match(new RegExp(/[a-z0-9\-\_]{1,}/gi))[0];
// console.log(handle);

arr = ["hello"];
console.log(arr.join(","));

(function () {
  let MAIN_OBJ = {
    init: function () {
      // initial code
      // call next function
      let getData = this.anotherFn();
      this.nextFn(getData);
    },
    nextFn: function (data) {
      console.log(data);
    },
    anotherFn: function () {
      return "value from another fn";
    },
    ANOTHER_OBJ: {
      fn: function () {},
    },
  };
  // call initial fun
  MAIN_OBJ.init();
})();
