const loadJson = (url, callback) => {
  const xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      callback(this.response);
    }
  };
  xhttp.responseType = 'json';
  xhttp.open('GET', url, true);
  xhttp.send();
};

const chartConfig = {
  type: 'bar',
  data: {},
  options: {
    spanGaps: true,
    legend: {
      position: 'top',
      display: true,
    },
    responsive: true,
    title: {
      display: true,
      text: 'Chart',
    },
    tooltips: {
      mode: 'index',
    },
    hover: {
      mode: 'index',
    },
    scales: {
      xAxes: [{
        scaleLabel: {
          display: true,
          labelString: 'date',
        },
      }],
      yAxes: [{
        stacked: false,
        id: 'block_count',
        position: 'left',
        scaleLabel: {
          display: true,
          labelString: 'block_count',
        },
      }],
    },
  },
};

const callback = (response) => {
  const data = {};
  data.labels = [];
  data.datasets = [];

  const vaultBlockCountDs = {};
  const kaliumBlockCountDs = {};

  const vaultBlockCementedDs = {};
  const kaliumBlockCementedDs = {};

  vaultBlockCountDs.label = 'vault_block_count';
  kaliumBlockCountDs.label = 'kalium_block_count';

  vaultBlockCementedDs.label = 'vault_block_cemented';
  kaliumBlockCementedDs.label = 'kalium_block_cemented';

  vaultBlockCountDs.borderColor = '#00FF00';
  kaliumBlockCountDs.borderColor = '#FFFF77';

  vaultBlockCementedDs.borderColor = '#007700';
  kaliumBlockCementedDs.borderColor = '#777733';

  data.datasets.push(vaultBlockCountDs);
  data.datasets.push(kaliumBlockCountDs);

  data.datasets.push(vaultBlockCementedDs);
  data.datasets.push(kaliumBlockCementedDs);

  for (let ix = 0; ix < data.datasets.length; ix++) {
    data.datasets[ix].data = [];
    data.datasets[ix].backgroundColor = 'rgb(255,255,255)';
    data.datasets[ix].hidden = false;
    data.datasets[ix].steppedLine = false;
    data.datasets[ix].fill = false;
    data.datasets[ix].type = 'line';
    data.datasets[ix].yAxisID = 'block_count';
  }


  // {
  // 	"banano": 4800,
  // 	"date": "2018-09-07T22:57:04",
  // 	"nano": 4000000
  // },

  chartConfig.data = data;

  const eltByDate = {};

  // 2021_09_10_01_05_AM
  const regexpStr = '^(\\d{4})_(\\d{2})_(\\d{2})_(\\d{2})_(\\d{2})_(AM|PM)$';
  const dateRegExp = new RegExp(regexpStr);
  for (let ix = 0; ix < response.length; ix++) {
    const elt = response[ix];
    // console.log('elt.ts', elt.ts);
    const result = dateRegExp.exec(elt.ts);
    const year = +result[1];
    const month = +result[2]-1; // added -1 to correct for the zero-based months
    const day = +result[3];
    let hour = +result[4];
    const minute = +result[5];
    const second = 0;
    // console.log('result', result);
    if ((result[6] === 'PM') && (hour !== 12)) {
      hour += 12;
    } else if ((result[6] === 'AM') && (hour === 12)) {
      hour -= 12;
    }
    const date = new Date(year, month, day, hour, minute, second);
    elt.ts = date.toISOString();
    elt.tsMillis = date.getTime();
    // console.log('elt.tsMillis', elt.tsMillis);
  }

  response.sort((a, b) => {
    return a.tsMillis - b.tsMillis;
  });

  for (let ix = 0; ix < response.length; ix++) {
    const elt = response[ix];
    const date = elt.ts;

    data.labels[ix] = date;

    elt.envs.forEach((envElt) => {
      if (envElt.block_count) {
        // console.log('envElt', envElt);
        if (envElt.env == 'vault') {
          vaultBlockCountDs.data[ix] = envElt.block_count.count;
          vaultBlockCementedDs.data[ix] = envElt.block_count.cemented;
        }
        if (envElt.env == 'kalium') {
          kaliumBlockCountDs.data[ix] = envElt.block_count.count;
          kaliumBlockCementedDs.data[ix] = envElt.block_count.cemented;
        }
      }
    });
  }
  const datasets = data.datasets;
  const labels = data.labels;
  for (let labelIx = 0; labelIx < labels.length; labelIx++) {
    const label = labels[labelIx];
    let removeIxFlag = true;
    if (labelIx == 0) {
      removeIxFlag = false;
    } else {
      for (let dataSetIx = 0; dataSetIx < datasets.length; dataSetIx++) {
        const dataEltN0 = datasets[dataSetIx].data[labelIx];
        if(dataEltN0 !== undefined) {
          const dataEltN1 = datasets[dataSetIx].data[labelIx-1];
          // console.log('dataElt', labelIx, label, dataEltN0, dataEltN1);
          const roundN0 = Math.round(dataEltN0/10000);
          const roundN1 = Math.round(dataEltN1/10000);
          if (roundN0 != roundN1) {
            // console.log('labelIx', labelIx, label, roundN0, roundN1);
            removeIxFlag = false;
          }
        }
      }
    }
    if (removeIxFlag) {
      data.labels.splice(labelIx, 1);
      for (let dataSetIx = 0; dataSetIx < datasets.length; dataSetIx++) {
        datasets[dataSetIx].data.splice(labelIx, 1);
      }
      labelIx--;
    }
  }

  // console.log(chartConfig.data);

  const ctx = document.getElementById('count-canvas').getContext('2d');
  window.myLine = new Chart(ctx, chartConfig);
};

window.onload = () => {
  loadJson('index.json', callback);
};