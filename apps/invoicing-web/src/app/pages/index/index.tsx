import React, { useState, useEffect, useCallback } from "react";

import Form from "antd/es/form";
import Checkbox from "antd/es/checkbox";
import Input from "antd/es/input";
import Button from "antd/es/button";

// import styles from "./index.css";

const PayerForm = (props: any) => {
  const [author, setAuthor] = useState({ name: "", email: "", country: "" });
  const [values, setValues] = useState({
    confirmDirty: false,
    vatNumber: "",
    isIndividual: true,
  });

  useEffect(() => {
    if (props.author) {
      setAuthor(props.author);
    }
  }, [props.author]);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    // this.props.form.validateFieldsAndScroll((err, values) => {
    //  if (!err) {
    //    console.log("Received values of form: ", values);
    //    console.log("Received values of form: ", author);
    //  }
    // });
    props.onSubmit(1, { ...values, ...author });
  };

  const onChange = useCallback(
    event => {
      const { name, value, checked } = event.target;

      if (name === "name" || name === "email") {
        setAuthor(v => ({ ...v, [name]: value }));
      }

      if (name === "isIndividual") {
        setValues(v => ({ ...v, [name]: checked }));
      }
    },
    [setValues, setAuthor],
  );

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
        <Input placeholder="name" name="name" value={author.name} onChange={onChange} />
      </Form.Item>
      <Form.Item label="E-mail">
        <Input name="email" value={author.email} onChange={onChange} />
      </Form.Item>
      <Form.Item label="Country">
        <Input name="country" value={author.country} readOnly />
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

const WrappedPayerForm = Form.create({
  name: "billing_address_form",
})(PayerForm);

export const Index = WrappedPayerForm;
