import React from 'react';
import { withRedux } from '../../src/lib/redux'
import SwipeableViews from 'react-swipeable-views';
import { useSelector, useDispatch } from 'react-redux'
import Map from '../../src/components/Map/Map';
import Status from '../../src/components/Game/status';
import GameOver from '../../src/components/Game/gameOver';
import Chat from '../../src/components/Game/chat';
import Router from "next/router"
import useInterval from '../../src/lib/useInterval'
import { GameState } from '../../src/constants';
import { AppWithAuthorization } from "../../src/components/App";
import { db } from "../../src/firebase";
import { db as dbSnapshot } from "../../src/firebase/firebase";
import { GameStateGlobal } from '../../src/constants';

require('rsuite/lib/styles/index.less');

const useGame = () => {
	const currentGameState = useSelector(state => state.gameState)
	const dispatch = useDispatch()
	const CurrentGame = useSelector(state => state.currentGame)
	const gameValues = useSelector(state => state.currentGameValues)
	const playerValues = useSelector(state => state.currentGamePlayerValues)
	const isGameOver = useSelector(state => state.gameisOver)
	const objectiveList = useSelector(state => state.currentObjectives)
	const GameTeamList = useSelector(state => state.currentGameTeamList)
	let getObjectiveList = function () {
		return db.getObjectiveList(CurrentGame)
			.then(list => {
				return list.docs.map(doc => doc.data());
			});
	}
	let currentObjectiveList = getObjectiveList();
	currentObjectiveList.then(function (list) {
		if (objectiveList.length != list.length) {
			dispatch({
				type: 'GET_OBJECTIVELIST',
				list
			})
		}
	});
	// dbSnapshot.collection('games').doc(CurrentGame).onSnapshot(
	// 	function (querySnapshot) {
	// 		if (querySnapshot.data().state == GameStateGlobal.Finished) {
	// 			Router.push('/dashboard');
	// 		}
	// 	}
	// );
	useInterval(() => {
		dispatch({
			type: 'TICK',
			light: true,
			lastUpdate: (Date.now() / 1000),
		})
	}, 1000)
	var teamArray = [];
	db.getTeamList(CurrentGame).then(values => {
		values.docs.map(doc => {
			let teamVal = { "teamID": doc.data().id, "score": doc.data().score };
			teamArray.push(teamVal);
		})
	});

	useInterval(() => {
		db.getObjectiveList(CurrentGame).then(values => {
			values.docs.map(doc => {
				for (var i = 0; i < teamArray.length; i++) {
					if (doc.data().teamId == teamArray[i].teamID) {
						teamArray[i].score++;
					}
				}
			})
		})
		for (var i = 0; i < teamArray.length; i++) {
			db.updateTeamScore(CurrentGame, teamArray[i].teamID, teamArray[i].score);
		}
	}, 5000)

	// const userValues = useSelector(state => state.userValues)
	const AuthUser = useSelector(state => state.authUser)
	const gameChat = () =>
		dispatch({
			type: 'gameChat',
			gameState: GameState.chat
		})
	const gameMain = () =>
		dispatch({
			type: 'gameMain',
			gameState: GameState.main
		})
	const gameStatus = () =>
		dispatch({
			type: 'gameStatus',
			gameState: GameState.status
		})
	// const getCurrentGame = () => {
	// 	console.log(db.getGameId(AuthUser.uid));
	// }

	return { GameTeamList, isGameOver, currentGameState, gameValues, playerValues, gameChat, gameMain, gameStatus, CurrentGame, AuthUser, objectiveList }
}

const Game = () => (
	<AppWithAuthorization>
		<GameBase />
	</AppWithAuthorization>
);

const GameBase = () => {
	const { GameTeamList, isGameOver, currentGameState, gameValues, playerValues, gameChat, gameMain, gameStatus, CurrentGame, AuthUser, objectiveList} = useGame()
	const handleChangeIndex = index => {
		if (index === GameState.chat) {
			gameChat();
		} else if (index === GameState.main) {
			gameMain();
		} else {
			gameStatus();
		}
	};
	return (
		<React.Fragment>
			{(function () {
				if (isGameOver) {
					return (
						<GameOver
							AuthUser={AuthUser}
							currentGame={CurrentGame}
							gameMain={gameMain}
							gameValues={gameValues}
							playerValues={playerValues}
							GameTeamList={GameTeamList}
						/>
					);
				} else {
					return (
						<SwipeableViews
							resistance={true}
							index={currentGameState}
							onChangeIndex={handleChangeIndex}>
							<Chat
								gameMain={gameMain}
								currentGame={CurrentGame}
								userId={AuthUser}
								playerValues={playerValues}
							/>
							<Map
								gameValues={gameValues}
								currentGame={CurrentGame}
								objectives={objectiveList}
								userId={AuthUser.uid}
								playerValues={playerValues}
								teamList={GameTeamList}
							/>
							<Status
								currentGame={CurrentGame}
								gameMain={gameMain}
								gameValues={gameValues}
							/>
						</SwipeableViews>
					);
				}
			})()}
		</React.Fragment >
	)
}

useGame.getInitialProps = ({ reduxStore }) => {
	const { dispatch } = reduxStore
	dispatch({
		type: 'TICK',
		light: typeof window === 'object',
		lastUpdate: (Date.now() / 1000),
	})

	return {}
}

export default withRedux(Game);
