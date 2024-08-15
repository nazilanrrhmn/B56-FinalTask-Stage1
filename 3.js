function cetakPola(n) {
  // Loop untuk setiap baris dari 0 hingga n-1
  for (let i = 0; i < n; i++) {
    // Mencetak spasi untuk indentasi
    let row = ' '.repeat(i);

    // Mencetak karakter berdasarkan baris
    let count = n - i;
    if (i % 2 === 0) {
      // Baris genap: # + # + #
      for (let j = 0; j < count; j++) {
        row += (j % 2 === 0) ? '#' : '+';
        if (j < count - 1) row += ' '; // spasi antar karakter
      }
    } else {
      // Baris ganjil: + + + +
      for (let j = 0; j < count; j++) {
        row += '+';
        if (j < count - 1) row += ' '; // spasi antar karakter
      }
    }

    // Cetak baris lengkap
    console.log(row);
  }
}

// Test the function
cetakPola(5);