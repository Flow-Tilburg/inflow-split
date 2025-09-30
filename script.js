const imageInput = document.getElementById('imageInput');
const imageDisplay = document.getElementById('imageDisplay');
const imageContainer = document.getElementById("image-container")
const splitInput = document.getElementById('splitInput');
const splitButton = document.getElementById('splitButton');
const downloadZipButton = document.getElementById('downloadZipButton');
const splitLinesContainer = document.getElementById('splitLines');

let imageData = [];
let imgHeight;
let fullImgHeight;
let containerHeight = imageContainer.getBoundingClientRect().height

imageInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imageDisplay.src = e.target.result;
            let full_img = new Image();
            full_img.src = imageDisplay.src;
            full_img.onload = () => {
                imgHeight = imageDisplay.height
                imageContainer.style.width = imageDisplay.width; 
                fullImgHeight = full_img.height
                updateSplitLines();
            }
        };
        reader.readAsDataURL(file);

    }
});

splitInput.addEventListener('input', updateSplitLines);

downloadZipButton.addEventListener('click', () => {
    const heights = splitInput.value.split(',').map(height => parseInt(height, 10));
    console.log(heights)
    heights.sort(function(a, b) {
        return a - b;
    });
    console.log(heights)
    if (heights.some(height => isNaN(height) || height <= 0)) {
        alert('Please enter valid heights.');
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = imageDisplay.src;
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        let startHeight = 0;
        imageData = [];
        heights.forEach((height, index) => {
            startHeight = index == 0 ? 0 : heights[index-1]
            clipHeight = height - startHeight
            if (height <= fullImgHeight && clipHeight != 0) {
                // const endHeight = startHeight + height;
                console.log("Start & end:", startHeight, clipHeight)
                const sectionCanvas = document.createElement('canvas');
                sectionCanvas.width = img.width;
                sectionCanvas.height = clipHeight;
                const sectionCtx = sectionCanvas.getContext('2d');
                sectionCtx.drawImage(canvas, 0, startHeight, img.width, clipHeight, 0, 0, img.width, clipHeight);
                imageData.push(sectionCanvas.toDataURL());
                // startHeight = endHeight;
            }
        });

        // Add the remaining part of the image
        startHeight = startHeight + clipHeight
        if (startHeight < img.height) {
            const remainingCanvas = document.createElement('canvas');
            remainingCanvas.width = img.width;
            remainingCanvas.height = img.height - startHeight;
            const remainingCtx = remainingCanvas.getContext('2d');
            remainingCtx.drawImage(canvas, 0, startHeight, img.width, img.height - startHeight, 0, 0, img.width, img.height - startHeight);
            imageData.push(remainingCanvas.toDataURL());
        }

        return downloadBlobs()
        // downloadZipButton.disabled = false;
    };
});

function downloadBlobs() {
    const zip = new JSZip();
    imageData.forEach((dataURL, index) => {
        const blob = dataURLToBlob(dataURL);
        zip.file(`section_${index + 1}.png`, blob);
    });

    zip.generateAsync({ type: 'blob' }).then((content) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'split_images.zip';
        link.click();
    });
};

function updateSplitLines() {
    const heights = splitInput.value.split(',').map(height => parseInt(height, 10));
    heights.sort(function(a, b) {
        return a - b;
    });
    if (heights.some(height => isNaN(height) || height <= 0)) {
        splitLinesContainer.innerHTML = '';
        return;
    }
    console.log("Scaler:",imgHeight/fullImgHeight, imgHeight, fullImgHeight)
    splitLinesContainer.innerHTML = '';
    heights.forEach(height => {
        if (height<fullImgHeight) {
            const line = document.createElement('div');
            line.style.top = `${(containerHeight - imgHeight) / 2 + height * (imgHeight/fullImgHeight)}px`;
            splitLinesContainer.appendChild(line);
        }
    });
}

function dataURLToBlob(dataURL) {
    const byteString = atob(dataURL.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: 'image/png' });
}
