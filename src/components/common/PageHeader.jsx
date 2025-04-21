import React from 'react';
import PropTypes from 'prop-types';

/**
 * PageHeader component for consistent page headers throughout the admin platform
 */
const PageHeader = ({ title, subtitle, actions }) => {
  return (
    <div className="border-b border-gray-200 pb-5 mb-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex space-x-3">{actions}</div>
        )}
      </div>
    </div>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  actions: PropTypes.node
};

export default PageHeader; 