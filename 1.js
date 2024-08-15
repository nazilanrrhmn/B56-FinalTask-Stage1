function calculateTotalInvestment(initialCapital) {
  // Investasi ke deposito bank
  const deposito = 350_000_000; // 350 juta
  const depositoRate = 0.035; // 3,5% per tahun

  // Investasi ke obligasi negara
  const obligasi = 650_000_000; // 650 juta
  const obligasiRate = 0.13; // 13% per tahun

  // Investasi ke saham A
  const sahamATotal = initialCapital * 0.35; // 35% dari total modal
  const sahamARate = 0.145; // 14,5% per tahun

  // Investasi ke saham B
  const sahamBTotal = initialCapital - deposito - obligasi - sahamATotal; // Sisa modal
  const sahamBRate = 0.125; // 12,5% per tahun

  // Fungsi untuk menghitung nilai investasi setelah 2 tahun
  function calculateInvestmentValue(principal, rate, years) {
    return principal * Math.pow(1 + rate, years);
  }

  // Menghitung nilai masing-masing investasi setelah 2 tahun
  const depositoValue = calculateInvestmentValue(deposito, depositoRate, 2);
  const obligasiValue = calculateInvestmentValue(obligasi, obligasiRate, 2);
  const sahamAValue = calculateInvestmentValue(sahamATotal, sahamARate, 2);
  const sahamBValue = calculateInvestmentValue(sahamBTotal, sahamBRate, 2);

  // Total nilai investasi setelah 2 tahun
  const totalValue = depositoValue + obligasiValue + sahamAValue + sahamBValue;

  console.log(
    `Total uang investor setelah dua tahun adalah: ${totalValue.toLocaleString(
      "id-ID",
      { style: "currency", currency: "IDR" }
    )}`
  );
}

// Memanggil fungsi dengan modal awal 1 miliar
calculateTotalInvestment(1_000_000_000);
