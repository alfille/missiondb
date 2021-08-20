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

class Button extends React.Component {
	constructor(props) {
		super(props);
		this.state = {isToggleOn: true };
		this.handleClick = this.handleClick.bind(this);
	}
	
	handleClick() {
		this.setState(oldState => ({
			isToggleOn: !oldState.isToggleOn
		})) ;
	}
	
	render() {
		return (
		<button onClick={this.handleClick}>
			

class HelloWorldBanner extends React.Component {
  render(){
    return (
      <div class="menu">
        <h1>Hello World</h1>
        <MyList data={['Hi', 'I am', 'Shing Lyu']}></MyList>
      </div>
    )
  }
}
