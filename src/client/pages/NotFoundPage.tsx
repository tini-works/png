import React from 'react';
import { Link } from 'react-router-dom';
import { NonIdealState, Button, Intent } from '@blueprintjs/core';

const NotFoundPage: React.FC = () => {
  return (
    <div className="not-found-page">
      <NonIdealState
        icon="error"
        title="Page Not Found"
        description="The page you are looking for does not exist or has been moved."
        action={
          <Button
            intent={Intent.PRIMARY}
            text="Go to Dashboard"
            component={Link}
            to="/dashboard"
          />
        }
      />
    </div>
  );
};

export default NotFoundPage;

