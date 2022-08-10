// const url = "https://afzal-test-shop.myshopify.com/products/color_box";
const url = "https://afzal-test-shop.myshopify.com/products/a-product-for-via";

// Calling that async function
const js = await getapi(url + ".js"),
  jsonData = await getapi(url + ".json");

// import { js, jsonData } from "./data.js";

console.log(`js`, js);
console.log(`jsonData`, jsonData);

const bigImage = document.getElementById("big-img"),
  bigVideo = document.getElementById("big-video"),
  smallImagesRow = document.getElementsByClassName("small-img-row")[0],
  title = document.getElementById("title"),
  description = document.getElementById("description"),
  price = document.getElementById("price"),
  comparedPrice = document.getElementById("compared-price"),
  addToCartBtn = document.querySelector("a.btn"),
  variantsDiv = document.querySelector("#variants");

loadStaticData();

// sortedImagesObj to show images variant wise
const sortedImageObj = createImageObj(jsonData);
console.log(`sortedImageObj`, sortedImageObj);

// declare selectedOptions array to store the values of
// selected options by a user
// dynamically define SelectedOptions
const selectedOptions = {};
js.options?.forEach((option) => {
  selectedOptions[option.name] = option.values[0];
  loadDynamicContent();
});
console.log(selectedOptions);

function loadDynamicContent() {
  // load small images from our sortedImageObj ,load price , compared price,
  // also changes big image according to small images
  loadSmallImages(getVariantID().variantIDforimg);
  loadPrices(getVariantID().variantID);
  loadBigImage();
  loadmedia();
}

// load options from js
loadOptionsDom();
// also loads variant option buttons

// 1. make sold out visible on add to cart
// # check if selected combination is available -
// # then display the output on addtoCart btn
onClickBtnChangeFunctionality();
function onClickBtnChangeFunctionality() {
  variantBtnColorChange();
  addToCartBtnChange(...checkForCombination());
}

/* will work on this later if needed
// 2. assist user in selecting options
// - create possibility array
*/
// change color row variant buttons on every Alt+p keypress

document.addEventListener("keydown", (e) => {
  if (e.altKey && e.key == "p") changeColorVariantBtnStyle();
});

// ##############################################################################################################################
// declare functions

const changeColorVariantBtnStyle = foo();
function foo() {
  let i = 0;
  function inner() {
    if (i == 0) changeToDropDown();
    else if (i == 1) changeToColorSwatch();
    else if (i == 2) changeToImageSwatch();
    else if (i == 3) changeToBtn();
    i > 2 ? (i = 0) : i++;
  }
  return inner;
}

// function to load static data - load title , description , and  initial big image
function loadStaticData() {
  title.innerHTML = js.title;
  description.innerHTML = js.description;
  bigImage.src = js.featured_image;
}
// function to create Image Obj
function createImageObj(jsonData) {
  const sortedImageObj = {};
  let arrLastID = [];
  function innerFunction() {
    jsonData.product.images.forEach((image) => {
      if (image.variant_ids[0]) {
        image.variant_ids.forEach((variant_id) => {
          sortedImageObj[variant_id]
            ? null
            : (sortedImageObj[`${variant_id}`] = []);
          sortedImageObj[variant_id].push(image.src);
        });
        arrLastID = image.variant_ids;
      } else {
        if (arrLastID.length == 0) {
          arrLastID.push("global-images");
        }

        arrLastID.forEach((lastID) => {
          (sortedImageObj[`${lastID}`] || (sortedImageObj[lastID] = [])).push(
            image.src
          );
        });
      }
    });
    // to push global images to every variant
    for (let key in sortedImageObj) {
      if (key != "global-images") {
        if (sortedImageObj["global-images"]) {
          sortedImageObj[key].push(...sortedImageObj["global-images"]);
        }
      }
    }
    // to delete the global images since we dont need them
    // actually we need them :)
    // delete sortedImageObj["global-images"];

    // to add media thumbnails with key "global-media"
    js.media.forEach((e) => {
      e.media_type != "image"
        ? (
            sortedImageObj["global-media"] ||
            (sortedImageObj["global-media"] = [])
          ).push([e.id, e.preview_image.src])
        : null;
    });
  }
  innerFunction();
  return sortedImageObj;
}

// load small images
function loadSmallImages(variantID) {
  smallImagesRow.innerHTML = "";
  sortedImageObj[`${variantID}`]?.forEach((imageUrl) => {
    smallImagesRow.appendChild(createSmallImage(imageUrl));
  });
}

// create a small image
function createSmallImage(imageUrl) {
  const imgCol = document.createElement("div");
  imgCol.className = "small-img-col";

  const img = document.createElement("img");
  img.src = imageUrl;
  img.style.width = `100%`;

  img.addEventListener("click", (e) => {
    onSmallImageClick(e);
  });
  imgCol.appendChild(img);
  return imgCol;
}

// on small Image Click
function onSmallImageClick(e) {
  loadBigImage(e.target.src);
}

// load prices by variant ID using js
function loadPrices(variantID) {
  let NO_VARIANT_FOUND = true;
  js.variants.forEach((variant) => {
    if (variant.id == variantID) {
      displayPrice(variant.price, variant.compare_at_price);
      NO_VARIANT_FOUND = false;
    }
  });
  if (NO_VARIANT_FOUND) {
    displayPrice("null", "null");
  }
}

function displayPrice(givenPrice, givenComparePrice) {
  if (givenPrice && givenComparePrice == "null") {
    price.innerText = "";
    comparedPrice.innerText = "";
  } else {
    price.innerText = String(givenPrice).slice(0, -2) + " INR";
    comparedPrice.innerText = String(givenComparePrice).slice(0, -2) + " INR";
  }
}

// load options in dom from js
function loadOptionsDom() {
  js.options.forEach((optionRowData) => {
    const labelAndRow = createOptionsRow(optionRowData);
    labelAndRow.forEach((e) => {
      variantsDiv.appendChild(e);
    });
  });
}

function createOptionsRow(optionRowData) {
  const label = document.createElement("label");
  label.innerText = optionRowData.name;
  const row = document.createElement("div");
  row.className = "row";
  row.id = `${optionRowData.name}`;
  row.position = `${optionRowData.position}`;
  optionRowData.values.forEach((value) => {
    row.appendChild(createVariantButton(value));
  });
  return [label, row];
}

// for creating swatch -
// #check if js.options.option.name = color
// # if color then for each value of values create a btn with image src = (
//  loop through js.variants to find the featured image of option1 = blue
//)

function createVariantButton(value) {
  // what to do when
  const btn = createBtn(value);
  // function for creating a variant btn

  return btn;
}

function onVariantBtnClick(e) {
  selectedOptions[e.target.parentElement.id] = e.target.value;

  //changes btn attributes - (btn background color to black)
  onClickBtnChangeFunctionality();
  // change dynmaic content (images and prices)
  loadDynamicContent();
}

// checkForCombination from js
function checkForCombination() {
  let combinationAvailable = false;
  let combinationMade = false;
  // write code to check if the combination is available and whether it is sold by the store.
  const arr = arrayOfObjectValues(selectedOptions);

  js.variants?.forEach((variant) => {
    if (arraysEqual(arr, variant.options)) {
      combinationMade = true;
      combinationAvailable = variant.available;
    }
  });
  return [combinationMade, combinationAvailable];
}
function addToCartBtnChange(combinationMade, combinationAvailable) {
  addToCartBtn.style.backgroundColor =
    combinationMade && combinationAvailable ? "#ff523b" : "#808080";
  addToCartBtn.innerText = combinationMade
    ? combinationAvailable
      ? "Add To Card"
      : "Sold Out"
    : "Combination Unavailable";
}
// variant btn color change on click functionality
function variantBtnColorChange() {
  // for buttons
  const btns = document.querySelectorAll("btn.btn");
  Array.from(btns).forEach((btn) => {
    for (const [index, [key, value]] of Object.entries(
      Object.entries(selectedOptions)
    )) {
      if (value == btn.value) {
        btn.style.backgroundColor = "black";
        break;
      } else btn.style.backgroundColor = "#ff523b";
    }
  });
  // for dropdowns
  const dropdown = document.getElementsByTagName("select")[0];
  if (dropdown) {
    //
    dropdown.value = selectedOptions["Color"];
  }
  // for color swatches
  const colorSwatchBtns = document.querySelectorAll("btn.btn-color-swatch");
  Array.from(colorSwatchBtns).forEach((btn) => {
    for (const [index, [key, value]] of Object.entries(
      Object.entries(selectedOptions)
    )) {
      if (selectedOptions[key] == btn.value) {
        btn.style.setProperty("--shadow", "0px 0px 0px 2px #ff523b");
        break;
      } else btn.style.setProperty("--shadow", "");
    }
  });

  // for image swatches
  const imageSwatchBtns = document.querySelectorAll("input.picker-img");
  Array.from(imageSwatchBtns).forEach((btn) => {
    for (const [index, [key, value]] of Object.entries(
      Object.entries(selectedOptions)
    )) {
      if (selectedOptions[key] == btn.value) {
        btn.style.backgroundColor = "black";
        break;
      } else btn.style.backgroundColor = "";
    }
  });
}

// used in loading images and prices
function getVariantID() {
  let variantIDforimg = 0,
    variantID = 0;

  js.variants.forEach((variant) => {
    let arrayOfSelectedOptionValues = arrayOfObjectValues(selectedOptions);
    if (arraysEqual(arrayOfSelectedOptionValues, variant.options)) {
      // ya to featured image nahi h
      if (variant.featured_image) {
        // option me images nahi de rakhi
        variantIDforimg = variant.featured_image.variant_ids[0];
      } else variantIDforimg = "global-images";
    }
    const arr = [];
    for (const [index, [key, value]] of Object.entries(
      Object.entries(selectedOptions)
    )) {
      arr[index] = value;
    }

    if (arraysEqual(variant.options, arr)) {
      variantID = variant.id;
    }
  });
  //

  return { variantIDforimg, variantID };
}

// function for creating a color variant image-swatch btn

// function for creating a color variant dropdown btn
function changeToDropDown() {
  // //

  const row1 = document.getElementById("Color");
  row1.innerHTML = "";
  row1.style.display = "block";
  createDropdown(row1);
  variantBtnColorChange();
}

function createDropdown(row1) {
  row1.innerHTML += `<select style="margin: 5px 0px 5px 45px"></select>`;
  const select = document.getElementsByTagName("select")[0];
  for (let i = 0; i < js.options.length; i++) {
    if (js.options[i].name == "Color") {
      for (let j = 0; j < js.options[i].values.length; j++) {
        select.innerHTML += `<option value="${js.options[i].values[j]}">${js.options[i].values[j]}</option>`;
      }
    }
  }
  select.addEventListener("change", (e) => {
    onVariantBtnClick(e);
  });
  // //
}

function changeToBtn() {
  const row1 = document.getElementById("Color");
  row1.style.display = "flex";
  row1.innerHTML = "";
  const values = [];
  js.options.forEach((option) => {
    option.name == "Color" ? values.push(...option.values) : null;
  });
  values.forEach((value) => {
    const btn = createBtn(value);
    row1.appendChild(btn);
  });
  variantBtnColorChange();
}

// function for creating a color variant btn
function createBtn(value) {
  const btn = document.createElement("btn");
  btn.className = "btn";
  btn.style.margin = "10px";
  btn.value = value;
  btn.style.padding = "4px 30px";
  btn.innerText = value;
  btn.addEventListener("click", (e) => {
    onVariantBtnClick(e);
  });
  return btn;
}

// function for creating a color variant color-swatch btn
function changeToColorSwatch() {
  // //
  const row1 = document.getElementById("Color");
  row1.style.display = "flex";
  row1.innerHTML = "";
  const values = [];
  js.options.forEach((option) => {
    option.name == "Color" ? values.push(...option.values) : null;
  });
  values.forEach((value) => {
    const btn = createColorSwatchBtn(value);
    row1.appendChild(btn);
  });
  variantBtnColorChange();
}
// create color swatch btn
function createColorSwatchBtn(value) {
  const btn = createBtn(value);
  btn.className = "btn-color-swatch";
  btn.innerText = "-----";
  btn.style.setProperty("--background-color", `${value}`);
  btn.style.setProperty("--background-on-hover", `${value}`);
  btn.style.setProperty("--color", `${value}`);

  return btn;
}

function changeToImageSwatch() {
  const row1 = document.getElementById("Color");
  row1.innerHTML = "";
  row1.style.display = "flex";
  const values = [];
  js.options.forEach((option) => {
    option.name == "Color" ? values.push(...option.values) : null;
  });
  console.log(`values to display in image swatch`, values);

  createImageSwatch(values, row1);
  variantBtnColorChange();
}

function createImageSwatch(values, row1) {
  let ArrImageSrc = [];
  for (let i = 0; i < values.length; i++) {
    for (let j = 0; j < js.variants.length; j++) {
      if (js.variants[j][`option${getColorPosition()}`] == values[i]) {
        if (js.variants[j].featured_image) {
          ArrImageSrc.push(js.variants[j].featured_image.src);
          break;
        } else if (j == js.variants.length - 1) {
          ArrImageSrc.push(sortedImageObj["global-images"][0]);
        }
      }
    }
  }

  ArrImageSrc.forEach((imgSrc, index) => {
    const imageEl = document.createElement("input");
    imageEl.type = "image";
    imageEl.className = "picker-img";
    imageEl.value = values[index];
    imageEl.src = imgSrc;
    imageEl.style.border = "0px solid #ff523b";
    imageEl.addEventListener("click", (e) => {
      onVariantBtnClick(e);
    });
    row1.appendChild(imageEl);
  });
}

// additional functionality to keep the number of pieces to buy at a time from 1 to 4

buyingLimit(4);
function buyingLimit(limit) {
  const amountInput = document.getElementById("amount-input");
  amountInput.setAttribute("max", `${limit}`);
  amountInput.addEventListener("keydown", (e) => {
    const regex = new RegExp(/[0-9]/);
    if (regex.test(e.key)) {
      e.target.value = e.key;
      setTimeout(() => {
        e.target.value > limit
          ? e.key > limit
            ? (e.target.value = limit)
            : (e.target.value = e.key)
          : null;
        e.target.value < 1 ? (e.target.value = 1) : null;
      }, 0);
    }
  });
}

// Defining async function
async function getapi(url) {
  // Storing response
  const response = await fetch(url);
  // Storing data in form of JSON
  var data = response.json();
  return data;
}

// my own array equals function
// const condition = arraysEqual(arr1, arr2);
// function arraysEqual(arr1, arr2) {
//   let tr = true;
//   arr1.forEach((e, i) => {
//     arr2.forEach((l, j) => {
//       if (i == j) {
//         if (arr1[i] !== arr2[j]) {
//           tr = false;
//         }
//       }
//     });
//   });
//   return tr;
// }
// //

// // // copied from stackOverFlow
function arraysEqual(a, b) {
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;
  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// // random code
// const mySet = new Set();
// mySet.add(2);
// mySet.add(3);
// const myArr = [2, 3];

// const set_array = arraysEqual(mySet, myArr);
// //

function getColorPosition() {
  let colorPosition = null;
  js.options.forEach((option) => {
    option.name == "Color" ? (colorPosition = option.position) : null;
  });
  return colorPosition;
}

function arrayOfObjectValues(givenObject) {
  const arr = [];
  for (const [index, [key, value]] of Object.entries(
    Object.entries(givenObject)
  )) {
    arr[index] = value;
  }
  return arr;
}

function loadBigImage(imgSrc) {
  if (bigImage.style.display == "none") {
    bigImage.style.display = "";
    bigVideo.style.display = "none";
  }
  if (imgSrc) {
    bigImage.src = imgSrc;
  } else {
    const firstSmallImage = document.querySelector(".small-img-col img");
    bigImage.src = firstSmallImage?.src || "";
  }
}

function onVideoClick(e) {
  console.log(`e.target`, e.target);
  console.log(
    `e.target.parentElement.childNodes[0].src = `,
    e.target.parentElement.childNodes[0].id
  );
  js.media.forEach((media) => {
    media.id == e.target.parentElement.childNodes[0].id
      ? displayVideo(media)
      : null;
  });
}
function displayVideo(mediaObj) {
  if (mediaObj.media_type == "external_video") {
    if (mediaObj.host == "youtube") {
      bigVideo.innerHTML = `<iframe width="475" height="310" src="https://www.youtube-nocookie.com/embed/${mediaObj.external_id}?autoplay=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    } else if (mediaObj.host == "vimeo") {
      bigVideo.innerHTML = `<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/${mediaObj.external_id}?h=e7e9d7498c&color=ffffff&title=0&byline=0&portrait=0&autoplay=1&loop=1&autopause=0"" style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0"  allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>`;
    }
  } else if (mediaObj.media_type == "video") {
    bigVideo.innerHTML = `<video id="myVideo" src = "${mediaObj.sources[0].url}" width="475" height="310">`;
    myVideo.load();
    myVideo.play();
    myVideo.addEventListener("click", () => {
      myVideo.paused || myVideo.ended ? myVideo.play() : myVideo.pause();
    });
  }

  bigImage.style.display = "none";
  bigVideo.style.display = "block";
}

function loadmedia() {
  sortedImageObj["global-media"]?.forEach(([id, mediaSrc]) => {
    const imgCol = document.createElement("div");
    imgCol.className = "small-img-col";
    const video = document.createElement("div");
    video.className = "video";
    video.addEventListener("click", onVideoClick);
    const a = document.createElement("a");
    // a.href = "";
    const mediaImg = document.createElement("img");
    mediaImg.className = "media-image";
    mediaImg.src = mediaSrc;
    mediaImg.id = id;
    video.appendChild(mediaImg);
    video.appendChild(a);
    imgCol.appendChild(video);
    smallImagesRow.appendChild(imgCol);
  });
}
