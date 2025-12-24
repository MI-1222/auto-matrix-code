import { MATRIX_CODE } from '../config.matrix-code';

function run() {
  console.log(`\tA\tB\tC\tD\tE\tF\tG\tH\tI\tJ`)
  for (let i=0; i<7; i++) {
    let rtn = `${i+1}`
    for (let j=0; j<10; j++) {
      rtn += `\t${MATRIX_CODE[j][i]}`
    }
    console.log(rtn)
  }
}

run();