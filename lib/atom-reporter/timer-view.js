/** @babel */
/** @jsx etch.dom */

import etch from "etch";

const defaultProps = {
	time: 0,
	startedAt: null,
	endedAt: null,
	timePaused: 0,
};

export default class TimerView {
	constructor(props) {

		this.props = { ...defaultProps, ...props };

		this.tick = this.tick.bind(this);

		etch.initialize(this);

		this.tick();
	}

	update(props) {
		this.props = { ...this.props, ...props };

		const update = etch.update(this);

		this.tick();

		return update;
	}

	destroy() {
		return etch.destroy(this);
	}

	tick() {
		if (this.props.startedAt && !this.props.endedAt && !this.props.paused) {
			requestAnimationFrame(() => {
				this.update({
					time: ((this.props.endedAt || Date.now()) - this.props.startedAt - this.props.timePaused) / 1000
				});
			});
		}
	}

	render() {
		return (
			<div className="time">
				{this.props.time.toFixed(2)}s
			</div>
		);
	}

}
