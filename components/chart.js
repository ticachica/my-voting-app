import React from 'react';
import {Doughnut} from 'react-chartjs-2' 

export default class extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      chartData: props.chartData
    }
  }

  static defaultProps = {
    displayTitle: true,
    displayLegend: true,
    legendPosition: 'bottom',
    titleText: 'Poll Results',
    chartData: {
      labels: ['Op1', 'Op2', 'Op3'],
      datasets: [
        {
          label: 'Votes',
          data: [
            5,
            2,
            1
          ],
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)'
          ]
        }
      ]
   }
  }

  render() {
    return (
      <div>
        <Doughnut 
          data={this.state.chartData}
          options={{
            title: {
              display: this.props.displayTitle,
              text: this.props.titleText,
              fontSize: 25
            },
            legend: {
              display: this.props.displayLegend,
              position: this.props.legendPosition
            }
          }}
        />
      </div>
    );
  }
};