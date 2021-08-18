class MyList extends React.Component {
  constructor(props) {
	  super(props);
	  this.state = {
		 patient_list: ['smith','jones']
	  }
  } 
  render() {
    var lis = this.state.patient_list.map(function(text, idx){
      return <li key={idx}>{text}</li>
    })
    return (
      <ul>
        {lis}
      </ul>
    )
  }
}

class HelloWorldBanner extends React.Component {
  render(){
    return (
      <div>
        <h1>Hello World</h1>
        <MyList data={['Hi', 'I am', 'Shing Lyu']}></MyList>
      </div>
    )
  }
}
