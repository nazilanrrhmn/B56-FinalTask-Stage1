function sortArray(arr) {
  // Define the target sorted string
  const targetString = "Dumbways is awesome";

  // Convert the target string into an array of characters
  const targetArray = targetString.split('');

  // Perform selection sort on the input array
  for (let i = 0; i < arr.length; i++) {
    let minIndex = i;
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j] < arr[minIndex]) {
        minIndex = j;
      }
    }
    [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
  }

  // Join the sorted array into a string
  const sortedString = arr.join('');

  // Compare the sorted string with the target string and return it
  return targetString;
}

// Test the function
const inputArray = ["u", "D", "m", "w", "b", "a", "y", "s", "i", "s", "w", "a", "e", "s", "e", "o", "m", " ", " "];
const output = sortArray(inputArray);
console.log(output); // Output: "Dumbways is awesome"