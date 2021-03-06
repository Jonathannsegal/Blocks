import React, { useState } from "react";
import Lottie from 'react-lottie'
import Map from '../../src/components/Stats/Map'
import { useDispatch, useSelector } from 'react-redux'
import { db } from "../../src/firebase";
import { db as dbSnapshot } from "../../src/firebase/firebase";
import { withRedux } from '../../src/lib/redux'
import Router from "next/router"
import { JoinState, JoinEditState, GameStateGlobal } from '../../src/constants';
import { CirclePicker } from 'react-color';
import SwipeableViews from 'react-swipeable-views';
import firebase from "firebase/app";
import { AppWithAuthorization } from "../../src/components/App";
import {
    Content,
    FlexboxGrid,
    Navbar,
    Nav,
    Icon,
    Header,
    Footer,
    Button,
    Container,
    Modal,
    List,
    Form,
    FormGroup,
    FormControl,
    ControlLabel,
    ButtonToolbar,
    ButtonGroup
} from 'rsuite';
import * as articulation from '../../src/db/articulation.json'
require('rsuite/lib/styles/index.less');

const articulationOptions = {
    loop: true,
    autoplay: true,
    animationData: articulation.default,
    rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice'
    }
};

const useJoin = () => {
    const dispatch = useDispatch()
    const CurrentGame = useSelector(state => state.currentGame)
    const gameValues = useSelector(state => state.currentGameValues)
    const AuthUser = useSelector(state => state.authUser)
    const currentState = useSelector(state => state.joinState)
    const teamCreateValues = useSelector(state => state.createTeamFormValue)
    const currentPlayerValues = useSelector(state => state.currentGamePlayerValues)
    const teamList = useSelector(state => state.currentGameTeamList)
    const teamEdit = useSelector(state => state.teamEdit)
    const allPlayerList = useSelector(state => state.playersForCurrentGame)
    const SelectedteamView = useSelector(state => state.joinScreenSelected)
    const edit = (item) => {
        dispatch({
            type: 'TEAMEDIT'
        })
        dispatch({
            type: 'JOIN_SELECTED_TEAM',
            item
        })
        let getteamPreviousValues = function (gameId, teamId) {
            return db.getSelectedTeamValues(gameId, teamId)
                .then(
                    value => {
                        return value;
                    }
                );
        }
        let teamPreviousValues = getteamPreviousValues(CurrentGame, item.id);
        teamPreviousValues.then(function (values) {
            updateTeamName(values.name);
            updateTeamColor(values.color);
        });
    }

    const noEdit = () => {
        dispatch({
            type: 'TEAMCREATE'
        })
        dispatch({
            type: 'JOIN_SELECTED_TEAM',
            item: null
        })
    }
    const teamlistfunction = (item) => {
        dispatch({
            type: 'TEAMLIST'
        })
        dispatch({
            type: 'JOIN_SELECTED_TEAM',
            item
        })
    }

    const createTeam = () => {
        db.doAddTeamToGame(CurrentGame, AuthUser.uid, (Date.now() / 1000) + teamCreateValues.name + AuthUser.uid, teamCreateValues.name, teamCreateValues.color);
        dispatch({
            type: 'joinMain'
        })
    }

    const updateTeam = () => {
        db.doUpdateTeam(CurrentGame, SelectedteamView.id, teamCreateValues.name, teamCreateValues.color);
        dispatch({
            type: 'joinMain'
        })
    }
    const deleteTeam = () => {
        db.doDeleteTeam(CurrentGame, SelectedteamView.id);
        dispatch({
            type: 'joinMain'
        })
    }

    const close = () => {
        dispatch({
            type: 'joinMain'
        })
    }
    const open = () => {
        dispatch({
            type: 'joinTeam'
        })
    }
    const waitingScreen = () => {
        dispatch({
            type: 'joinWait'
        })
    }
    const getPlayerValuesFunction = () => {
        let getcurrentGamePlayerValues = function (gameId, userId) {
            return db.getCurrentGamePlayerValues(gameId, userId)
                .then(
                    value => {
                        return value;
                    }
                );
        }
        let currentGamePlayerValues = getcurrentGamePlayerValues(CurrentGame, AuthUser.uid);
        currentGamePlayerValues.then(function (values) {
            if (values.length != teamList.length) {
                dispatch({
                    type: 'GET_CURRENTGAME_PLAYER_VALUES',
                    values
                })
            }
        });
    }
    let getTeamList = function (gameId) {
        return db.getTeamList(gameId)
            .then(list => {
                return list.docs.map(doc => doc.data());
            });
    }
    let currentTeamList = getTeamList(CurrentGame);
    currentTeamList.then(function (list) {
        if (JSON.stringify(list) != JSON.stringify(teamList)) {
            dispatch({
                type: 'GET_TEAMLIST',
                list
            })
        }
    });
    let functionGameValues = function (gameId) {
        if (gameId == null) {
            gameId = "none";
        }
        return db.onceGetGames(gameId)
            .then(value => {
                if (value == "No such document!") {
                    Router.push('/dashboard');
                }
                return value;
            });
    }
    let currentGameValues = functionGameValues(CurrentGame);
    currentGameValues.then(function (values) {
        if (JSON.stringify(values) != JSON.stringify(gameValues)) {
            dispatch({
                type: 'CURRENT_GAMEVALUE_SET',
                values
            })
        }
    });

    const updateCurrentGameValues = () => {
        let functionGameValues = function (gameId) {
            if (gameId == null) {
                gameId = "none";
            }
            return db.onceGetGames(gameId)
                .then(value => {
                    if (value == "No such document!") {
                        Router.push('/dashboard');
                    }
                    return value;
                });
        }
        let currentGameValues = functionGameValues(CurrentGame);
        currentGameValues.then(function (values) {
            if (JSON.stringify(values) != JSON.stringify(gameValues)) {
                dispatch({
                    type: 'CURRENT_GAMEVALUE_SET',
                    values
                })
            }
        });
    };

    const joinGame = (team) => {
        db.doSetGame(AuthUser.uid, CurrentGame);
        db.doAddPlayerToGame(CurrentGame, AuthUser.uid, AuthUser.displayName, new firebase.firestore.GeoPoint(1, 1), team.name, team.id);
        getPlayerValuesFunction();
        waitingScreen();
    }
    const setCurrentGame = (input) => (
        dispatch({
            type: 'SET_CURRENTGAME',
            input
        })
    )
    const goToGameFunction = () => {
        setCurrentGame(CurrentGame);
        db.doStartGame(CurrentGame, GameStateGlobal.Ongoing, (Date.now() / 1000), (Date.now() / 1000) + (60 * 5));
        updateCurrentGameValues();
        Router.push('/game');
    }
    dbSnapshot.collection('games').doc(CurrentGame).onSnapshot(
        function (querySnapshot) {
            if (querySnapshot.data().state == GameStateGlobal.Ongoing) {
                if (currentPlayerValues.length != 0) {
                    updateCurrentGameValues();
                    Router.push('/game');
                }
            }
        }
    );
    const updateTeamName = (input) => (
        dispatch({
            type: 'UPDATE_TEAMCREATE_NAME',
            payload: { txt: input }
        })
    )
    const updateTeamColor = (color) => (
        dispatch({
            type: 'UPDATE_TEAMCREATE_COLOR',
            color
        })
    )
    dbSnapshot.collection('games').doc(CurrentGame).collection('players').onSnapshot(
        function (querySnapshot) {
            let team = [];
            querySnapshot.forEach(function (doc) {
                team.push(doc.data());
            })
            if (team.length != allPlayerList.length) {
                dispatch({
                    type: 'GET_ALLCURRENTPLAYERSINGAME',
                    team
                })
            }
        }
    );
    return { updateTeam, deleteTeam, teamCreateValues, SelectedteamView, allPlayerList, teamlistfunction, edit, noEdit, teamEdit, AuthUser, currentPlayerValues, waitingScreen, teamList, updateTeamName, updateTeamColor, createTeam, currentState, close, open, joinGame, gameValues, CurrentGame, goToGameFunction, setCurrentGame }
}



const join = () => (
    <AppWithAuthorization>
        <JoinBase />
    </AppWithAuthorization>
);

const JoinBase = () => {
    const { updateTeam, deleteTeam, teamCreateValues, SelectedteamView, allPlayerList, teamlistfunction, edit, noEdit, teamEdit, AuthUser, currentPlayerValues, waitingScreen, teamList, updateTeamName, updateTeamColor, createTeam, currentState, close, open, joinGame, gameValues, CurrentGame, goToGameFunction, setCurrentGame } = useJoin();
    return (
        <React.Fragment>
            <SwipeableViews disabled={(currentState == JoinState.waiting) ? false : true} onChangeIndex={index => (index == 1) ? waitingScreen() : close()} index={(currentState == JoinState.waiting) ? 1 : 0}>
                <div className="fullHeight">
                    <Modal size='xs' show={currentState == JoinState.teamCreate} onHide={() => close()}>
                        {(function () {
                            switch (teamEdit) {
                                case JoinEditState.edit:
                                    return (
                                        <React.Fragment>
                                            <Modal.Header>
                                                <Modal.Title>Edit {SelectedteamView.name}</Modal.Title>
                                            </Modal.Header>
                                            <Modal.Body>
                                                <br />
                                                <FlexboxGrid justify="center">
                                                    <FlexboxGrid.Item colspan={18}>
                                                        <Form fluid>
                                                            <FormGroup>
                                                                <ControlLabel>Name</ControlLabel>
                                                                <FormControl onChange={value => updateTeamName(value)} name="name" placeholder={teamCreateValues.name} />
                                                            </FormGroup>
                                                            <br />
                                                            <FormGroup>
                                                                <CirclePicker color={teamCreateValues.color} onChange={value => updateTeamColor(value.hex)} />
                                                            </FormGroup>
                                                        </Form>
                                                        <br />
                                                        <br />
                                                        <h2>Players</h2>
                                                        <br />
                                                        <List>
                                                            {allPlayerList.map((item, index) => {
                                                                if (item.teamId == SelectedteamView.id) {
                                                                    return (
                                                                        <List.Item key={index} index={index}>
                                                                            {item.username}
                                                                        </List.Item>
                                                                    );
                                                                } else {
                                                                    return null;
                                                                }
                                                            }
                                                            )}
                                                        </List>
                                                    </FlexboxGrid.Item>
                                                </FlexboxGrid>
                                                <br />
                                            </Modal.Body>
                                            <Modal.Footer>
                                                <Button onClick={() => deleteTeam()} appearance="primary" color="red">
                                                    Delete
                                            </Button>
                                                <Button onClick={() => updateTeam()} appearance="primary">
                                                    Update
                                            </Button>
                                                <Button onClick={() => close()} appearance="subtle">
                                                    Cancel
                                            </Button>
                                            </Modal.Footer>
                                        </React.Fragment>
                                    );
                                case JoinEditState.create:
                                    return (
                                        <React.Fragment>
                                            <Modal.Header>
                                                <Modal.Title>Make a Team</Modal.Title>
                                            </Modal.Header>
                                            <Modal.Body>
                                                <br />
                                                <FlexboxGrid justify="center">
                                                    <FlexboxGrid.Item colspan={18}>
                                                        <Form fluid>
                                                            <FormGroup>
                                                                <ControlLabel>Name</ControlLabel>
                                                                <FormControl onChange={value => updateTeamName(value)} name="name" placeholder="Team Name" />
                                                            </FormGroup>
                                                            <br />
                                                            <FormGroup>
                                                                <CirclePicker onChange={value => updateTeamColor(value.hex)} />
                                                            </FormGroup>
                                                        </Form>
                                                    </FlexboxGrid.Item>
                                                </FlexboxGrid>
                                                <br />
                                            </Modal.Body>
                                            <Modal.Footer>
                                                <Button onClick={() => createTeam()} appearance="primary">
                                                    Create
                                            </Button>
                                                <Button onClick={() => close()} appearance="subtle">
                                                    Cancel
                                            </Button>
                                            </Modal.Footer>
                                        </React.Fragment>
                                    );
                                case JoinEditState.list:
                                    return (<React.Fragment>
                                        <Modal.Header>
                                            <Modal.Title>{SelectedteamView.name}</Modal.Title>
                                        </Modal.Header>
                                        <Modal.Body>
                                            <br />
                                            <List>
                                                {allPlayerList.map((item, index) => {
                                                    if (item.teamId == SelectedteamView.id) {
                                                        return (
                                                            <List.Item key={index} index={index}>
                                                                {item.username}
                                                            </List.Item>
                                                        );
                                                    } else {
                                                        return null;
                                                    }
                                                }

                                                )}
                                            </List>
                                            <br />
                                        </Modal.Body>
                                        <Modal.Footer>
                                            <Button onClick={() => close()} appearance="subtle">
                                                Close
                                            </Button>
                                        </Modal.Footer>
                                    </React.Fragment>);
                                default:
                                    return (
                                        <React.Fragment>
                                            <div>nothing here</div>
                                        </React.Fragment>
                                    );
                            }
                        })()}
                    </Modal>
                    <Container>
                        <Header>
                            <div className="fixedHeader">
                                <Navbar appearance="subtle">
                                    <Navbar.Body>
                                        <Nav>
                                            <Nav.Item icon={<Icon icon="chevron-left" />} href="/dashboard">Back</Nav.Item>
                                        </Nav>
                                    </Navbar.Body>
                                </Navbar>
                                <FlexboxGrid justify="center">
                                    <FlexboxGrid.Item colspan={18}>
                                        <FlexboxGrid justify="space-around">
                                            <h2 className="sectionTitle">{gameValues.name}</h2>
                                        </FlexboxGrid>
                                    </FlexboxGrid.Item>
                                    <FlexboxGrid.Item colspan={18}>
                                        <br />
                                        <FlexboxGrid justify="space-around">
                                            <ButtonToolbar>
                                                <ButtonGroup>
                                                    <Button appearance="subtle" size="lg">Choose a team</Button>
                                                    <Button appearance="primary" color="cyan" size="lg" onClick={() => { noEdit(); open() }}>Make a Team</Button>
                                                </ButtonGroup>
                                            </ButtonToolbar>
                                        </FlexboxGrid>
                                        <br />
                                    </FlexboxGrid.Item>
                                </FlexboxGrid>
                            </div>
                        </Header>
                        <Content>
                            <div className="teamListHeight">
                                <FlexboxGrid justify="center">
                                    <FlexboxGrid.Item colspan={20}>
                                        <List>
                                            {teamList.map((item, index) =>
                                                <List.Item key={index} index={index}>
                                                    <FlexboxGrid align="middle">
                                                        <FlexboxGrid.Item colspan={14}>
                                                            <a className="listItemsA" onClick={() => joinGame(item)}>
                                                                <FlexboxGrid justify="start">
                                                                    <FlexboxGrid.Item>
                                                                        <div className="color" style={{ backgroundColor: `${item.color}` }} />
                                                                        <div className="teamName">
                                                                            <h4>{item.name}</h4>
                                                                        </div>
                                                                        {/* {item.name} */}
                                                                    </FlexboxGrid.Item>
                                                                </FlexboxGrid>
                                                            </a>
                                                        </FlexboxGrid.Item>
                                                        {(function () {
                                                            if (AuthUser.uid == item.creator) {
                                                                return (
                                                                    <FlexboxGrid.Item colspan={10}>
                                                                        <FlexboxGrid justify="end">
                                                                            <FlexboxGrid.Item>
                                                                                <a onClick={() => { edit(item); open() }}>Edit / View</a>
                                                                            </FlexboxGrid.Item>
                                                                        </FlexboxGrid>
                                                                    </FlexboxGrid.Item>
                                                                );
                                                            } else {
                                                                return (
                                                                    <FlexboxGrid.Item colspan={10}>
                                                                        <FlexboxGrid justify="end">
                                                                            <FlexboxGrid.Item>
                                                                                <a onClick={() => { teamlistfunction(item); open() }}>View</a>
                                                                            </FlexboxGrid.Item>
                                                                        </FlexboxGrid>
                                                                    </FlexboxGrid.Item>
                                                                );
                                                            }
                                                        })()}
                                                    </FlexboxGrid>
                                                </List.Item>
                                            )}
                                        </List>
                                    </FlexboxGrid.Item>
                                </FlexboxGrid>
                            </div>
                        </Content>
                        <div className="bottomFooter">
                            <Footer>
                                <Map gameValues={gameValues} />
                            </Footer>
                        </div>
                    </Container>
                </div>
                {(function () {
                    switch (currentState) {
                        case JoinState.waiting:
                            return (
                                <div>
                                    <Container>
                                        <Header>
                                            <div className="fixedHeader">
                                                <Navbar appearance="subtle">
                                                    <Navbar.Body>
                                                        <Nav>
                                                            <Nav.Item icon={<Icon icon="gear-circle" />} onClick={() => close()}>Back</Nav.Item>
                                                        </Nav>
                                                    </Navbar.Body>
                                                </Navbar>
                                                <FlexboxGrid justify="center">
                                                    <FlexboxGrid.Item colspan={24}>
                                                        <FlexboxGrid justify="space-around">
                                                            <h2 className="sectionTitle">{currentPlayerValues.team}</h2>
                                                        </FlexboxGrid>
                                                    </FlexboxGrid.Item>
                                                </FlexboxGrid>
                                            </div>
                                        </Header>
                                        <Content>
                                            <div className="waitingAnimation">
                                                <Lottie
                                                    height={600}
                                                    width={350}
                                                    options={articulationOptions}
                                                    isClickToPauseDisabled={true}
                                                />
                                            </div>
                                        </Content>
                                        <div className="bottomFooter">
                                            <Footer>
                                                <FlexboxGrid justify="center">
                                                    <FlexboxGrid.Item>
                                                        {(function () {
                                                            if (AuthUser.uid == gameValues.gameCreator) {
                                                                return (
                                                                    <Button onClick={() => goToGameFunction()} color="cyan" size="lg" appearance="primary">Start Game</Button>
                                                                );
                                                            } else {
                                                                return (
                                                                    <h5>waiting for game to start</h5>
                                                                );
                                                            }
                                                        })()}
                                                    </FlexboxGrid.Item>
                                                </FlexboxGrid>
                                            </Footer>
                                            <br /><br /><br />
                                        </div>
                                    </Container>
                                </div>);
                        default:
                            return null;
                    }
                })()}
            </SwipeableViews>
            <style jsx>{`
                .color{
                    height: 2.5em;
                    // margin-top: -0.6em;
                    width: 2em;
                    float: left;
                    display:inline-block;
                }
                .teamName{
                    margin-left: 1em;
                    display:inline-block;
                }
                .listItemsA {
                    color: #000000;
                }
                .waitingAnimation{
                    margin-top: 8em;
                }
                .fullHeight{
                    height: 100vh;
                }
                .fixedHeader {
                    z-index: 1;
                    position: fixed;
                    width: 100vw;
                }
                .sectionTitle {
                    line-height: 1.5em;
                }
                .bottomFooter{
                    width: 100vw;
                    position: fixed;
                    bottom: 0;
                }
                .teamListHeight{
                    margin-top: 14em;
                    height: 40vh;
                    overflow: scroll;
                }
		`}</style>
        </React.Fragment >
    )
}

export default withRedux(join);
