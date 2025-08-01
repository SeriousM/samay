import React, { useState } from "react";
import Router from "next/router";
import Head from "next/head";
import { GetServerSideProps } from "next";
import { Container, Jumbotron, Form } from "react-bootstrap";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { getPoll } from "../../src/utils/api/server";
import VoterPollInfo from "../../src/components/poll/VoterPollInfo";
import PollTableVoter from "../../src/components/poll/PollTableVoter";
import SubmitTimes from "../../src/components/poll/SubmitTimes";
import Layout from "../../src/components/Layout";
import { TimeFromDB, Vote, PollFromDB } from "../../src/models/poll";
import { decrypt } from "../../src/helpers";

dayjs.extend(localizedFormat);

const Poll = (props: {
  pollFromDB: PollFromDB;
  pollID: string;
}): JSX.Element => {
  const { pollFromDB, pollID } = props;

  let pageSection = <></>;

  const sortedTimes: TimeFromDB[] = pollFromDB.times.sort(
    (a: TimeFromDB, b: TimeFromDB) => a.start - b.start
  );

  const [newVote, setNewVote] = useState<Vote>({
    name: "",
    times: [],
  });

  let showVoteRecordedGroup = false;
  let showVoteRecordedOneOnOne = false;
  let votedTimeOneOnOne = null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { value } = e.target;
    setNewVote({ name: value, times: newVote.times });
  };

  if (typeof window !== "undefined") {
    let createdPollsFromLS = JSON.parse(
      localStorage.getItem("samayCreatedPolls")
    );

    if (createdPollsFromLS && createdPollsFromLS.polls.length) {
      const lSKeyForPoll = `${pollID}-${
        pollFromDB.title ? pollFromDB.title : ""
      }`;

      for (let i = 0; i < createdPollsFromLS.polls.length; i += 1) {
        let poll = createdPollsFromLS.polls[i];

        if (
          Object.keys(poll)[0] === lSKeyForPoll &&
          poll[Object.keys(poll)[0]] === pollFromDB.secret
        ) {
          Router.push(`/poll/${pollID}/${decrypt(pollFromDB.secret)}`);
          return <></>;
        }
      }
    }

    let votedPollsFromLS = JSON.parse(localStorage.getItem("samayVotedPolls"));

    if (votedPollsFromLS && votedPollsFromLS.polls.length) {
      for (let i = 0; i < votedPollsFromLS.polls.length; i += 1) {
        let poll = votedPollsFromLS.polls[i];

        if (Object.keys(poll)[0] === pollID && pollFromDB.open) {
          pageSection = <></>;
          if (!pollFromDB.type || pollFromDB.type === "group") {
            showVoteRecordedGroup = true;
          } else {
            votedTimeOneOnOne = JSON.parse(
              (Object.values(poll)[0] as string).split("#")[1]
            );
            showVoteRecordedOneOnOne = true;
          }
          break;
        } else if (pollFromDB.open) {
          pageSection = (
            <>
              <div className="voter-page-main-container">
                <PollTableVoter
                  pollFromDB={pollFromDB}
                  sortedTimes={sortedTimes}
                  newVote={newVote}
                  setNewVote={setNewVote}
                />
              </div>
              <div className="voter-page-final-container">
                <Form.Control
                  className="voter-page-poll-mark-time-name"
                  type="text"
                  maxLength={30}
                  placeholder="Your name"
                  onChange={handleNameChange}
                  autoFocus
                />
                <SubmitTimes
                  newVote={newVote}
                  pollID={pollID}
                  pollFromDB={pollFromDB}
                />
              </div>
            </>
          );
        }
      }
    } else if (pollFromDB.open) {
      pageSection = (
        <>
          <div className="voter-page-main-container">
            <PollTableVoter
              pollFromDB={pollFromDB}
              sortedTimes={sortedTimes}
              newVote={newVote}
              setNewVote={setNewVote}
            />
          </div>
          <div className="voter-page-final-container">
            <Form.Control
              className="voter-page-poll-mark-time-name"
              type="text"
              maxLength={30}
              placeholder="Your name"
              onChange={handleNameChange}
              autoFocus
            />
            <SubmitTimes
              newVote={newVote}
              pollID={pollID}
              pollFromDB={pollFromDB}
            />
          </div>
        </>
      );
    }
  }

  return (
    <>
      <Head>
        <title>Samay — segna le tue disponibilità</title>
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Layout>
        <div className="global-page-section">
          <Container className="global-container">
            <Jumbotron className="poll-info-jumbo">
              <VoterPollInfo
                poll={pollFromDB}
                showFinalTime={!pollFromDB.open}
                showVoteRecordedGroup={showVoteRecordedGroup}
                showVoteRecordedOneOnOne={showVoteRecordedOneOnOne}
                votedTimeOneOnOne={votedTimeOneOnOne}
              />
            </Jumbotron>
            {pageSection}
          </Container>
        </div>
      </Layout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  let pollID = null;
  if (context.params) {
    pollID = context.params.id;
  }
  const getPollResponse = await getPoll(pollID);
  const pollFromDB = getPollResponse.data;

  if (getPollResponse.statusCode === 404) {
    return {
      redirect: {
        destination: "/404",
        permanent: false,
      },
    };
  }

  return {
    props: { pollFromDB, pollID }, // will be passed to the page component as props
  };
};

export default Poll;
