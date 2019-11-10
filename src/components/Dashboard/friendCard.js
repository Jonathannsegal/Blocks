import React from 'react';
import Lottie from 'react-lottie'
import * as trophy from '../../db/trophy.json'
import {
    Panel,
    Placeholder,
    FlexboxGrid,
    Avatar,
    Grid,
    Row,
    Col
} from 'rsuite';

const trophyOptions = {
    loop: true,
    autoplay: true,
    animationData: trophy.default,
    rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice'
    }
};


const FriendCard = () => {
    const { Paragraph } = Placeholder;
    return (
        <div className="cardContent">
            <Panel shaded>
                <FlexboxGrid justify="left">
                    <FlexboxGrid.Item colspan={8}>
                        <Avatar
                            circle
                            size="sm"
                            src="https://avatars2.githubusercontent.com/u/12592949?s=460&v=4"
                        />
                    </FlexboxGrid.Item>
                    <FlexboxGrid.Item colspan={8}>
                        <p className="username">Username</p>
                        <p className="location"> location</p>
                    </FlexboxGrid.Item>
                </FlexboxGrid>

                <FlexboxGrid justify="center">
                    <FlexboxGrid.Item colspan={6}>
                        <Lottie
                            height={20}
                            width={20}
                            options={trophyOptions}
                            isClickToPauseDisabled={true}
                        />
                    </FlexboxGrid.Item>
                    <FlexboxGrid.Item colspan={6}>
                        ###
                    {/* <Paragraph active /> */}
                    </FlexboxGrid.Item>
                </FlexboxGrid>
            </Panel >
            <style jsx>{`
                .username{
                    line-height: 1em;
                }
                .location{
                    line-height: 0em;
                    font-size: 0.8em;
                }
                .cardContent{
                    min-width: 150px;
                    margin-left: 0.5em;
                    margin-right: 0.5em;
                }
		`}</style>
        </div>
    )
}

export default FriendCard