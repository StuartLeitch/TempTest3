import React, { useState, useCallback } from "react";

// import { formatMessage } from "umi-plugin-locale";

import Form from "antd/es/form";
import Checkbox from "antd/es/checkbox";
import Icon from "antd/es/icon";
import Input from "antd/es/input";
import Button from "antd/es/button";

import styles from "./index.css";

const PayerForm = () => {
  const [values, setValues] = useState({
    confirmDirty: false,
    name: "",
    email: "",
    vatNumber: "",
    isIndividual: true,
  });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    // this.props.form.validateFieldsAndScroll((err, values) => {
    //  if (!err) {
    console.log("Received values of form: ", values);
    //  }
    // });
  };

  const onChange = useCallback(
    event => {
      const { name, value, checked } = event.target;

      if (name === "isIndividual") {
        setValues(v => ({ ...v, [name]: checked }));
      } else {
        setValues(v => ({ ...v, [name]: value }));
      }
    },
    [setValues],
  );

  // const handleChange = useCallback(
  //   event => {
  //     const { name, value } = event.target;
  //     setValues(v => ({ ...v, [name]: value }));
  //   },
  //   [setValues],
  // );

  // const [focused, setFocus] = React.useState<any | undefined>(undefined);
  // const handleFocus = React.useCallback(event => setFocus(event.target.name as any), [setFocus]);
  // const handleBlur = React.useCallback(() => setFocus(undefined), [setFocus]);

  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 8 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 16 },
    },
  };

  const tailFormItemLayout = {
    wrapperCol: {
      xs: {
        span: 24,
        offset: 0,
      },
      sm: {
        span: 16,
        offset: 8,
      },
    },
  };

  const label = `${values.isIndividual ? "Individual" : "Organisation"}`;

  return (
    <Form {...formItemLayout} style={{ marginTop: "30px" }} onSubmit={handleSubmit}>
      <Form.Item label="Name">
        <Input placeholder="name" name="name" value={values.name} onChange={onChange} />
      </Form.Item>
      <Form.Item label="E-mail">
        <Input name="email" value={values.email} onChange={onChange} />
      </Form.Item>
      <Form.Item label="Is Individual?">
        <Checkbox name="isIndividual" checked={values.isIndividual} onChange={onChange}>
          {label}
        </Checkbox>
      </Form.Item>
      {values.isIndividual ? null : (
        <Form.Item hasFeedback validateStatus="validating" label="VAT number">
          <Input name="vatNumber" value={values.vatNumber} />
        </Form.Item>
      )}
      <Form.Item {...tailFormItemLayout}>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

const WrappedPayerForm = Form.create({ name: "billing_address_form" })(PayerForm);

export const Index = WrappedPayerForm;
